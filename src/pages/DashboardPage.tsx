import { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { http } from "@/lib/http";
import { Download, Filter, X } from "lucide-react";
import { useMe } from "@/features/account/hooks/useMe";
import * as htmlToImage from 'html-to-image';
import jsPDF from "jspdf";

interface DashboardStats {
  totalProjects: number;
  totalCases: number;
  totalRuns: number;
  totalSuites: number;
  totalMilestones: number;
  passRate: number;
  automationRate: number;
  activeRuns: number;
  closedRuns: number;
}

interface TestCaseStatus {
  status: string;
  count: number;
}

interface TestResult {
  date: string;
  passed: number;
  failed: number;
  blocked: number;
}

interface SeverityData {
  severity: string;
  passed: number;
  failed: number;
}

interface AutomationStatusData {
  status: string;
  count: number;
}

interface PriorityData {
  priority: string;
  count: number;
}

interface ProjectActivity {
  projectName: string;
  cases: number;
  runs: number;
  suites: number;
}

interface DetailedIssueStats {
  total: number;
  byStatus: Record<string, number>;
  byIssueType: Record<string, number>;
  byAuthor: Record<string, number>;
  byPriority: Record<string, number>;
}

export default function DashboardPage() {
  const { me } = useMe();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [jiraStats, setJiraStats] = useState<DetailedIssueStats | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalCases: 0,
    totalRuns: 0,
    totalSuites: 0,
    totalMilestones: 0,
    passRate: 0,
    automationRate: 0,
    activeRuns: 0,
    closedRuns: 0,
  });
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [projectActivity, setProjectActivity] = useState<ProjectActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [me, selectedProjectIds]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load all projects
      const { data: projectsData } = await http.get("/api/projects/all");

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        setStats({
          totalProjects: 0,
          totalCases: 0,
          totalRuns: 0,
          totalSuites: 0,
          totalMilestones: 0,
          passRate: 0,
          automationRate: 0,
          activeRuns: 0,
          closedRuns: 0,
        });
        setLoading(false);
        return;
      }

      // Save projects to state
      setProjects(projectsData);

      // Filter projects based on selection
      const filteredProjects = selectedProjectIds.length > 0
        ? projectsData.filter((p: any) => selectedProjectIds.includes(p.id))
        : projectsData;

      // Load Jira statistics if user has a group
      const groupId = me?.currentGroupId ?? me?.groups?.[0]?.id;

      if (groupId && filteredProjects && filteredProjects.length > 0) {
        try {
          const projectIds = filteredProjects.map((p: any) => p.project?.id || p.id);
          const url = `/api/integrations/jira/projects-stats-detailed/${groupId}`;
          const params = new URLSearchParams();
          projectIds.forEach((id: number) => params.append('projectIds', id.toString()));

          const { data: jiraStatsData } = await http.get(`${url}?${params.toString()}`);
          setJiraStats(jiraStatsData);
        } catch (error) {
          console.error("❌ Failed to load Jira statistics:", error);
          setJiraStats(null);
        }
      }

      // Load data for filtered projects in parallel
      const projectsWithData = await Promise.all(
        filteredProjects.map(async (project: any) => {
          try {
            const [casesRes, runsRes, suitesRes, milestonesRes] = await Promise.all([
              http.get(`/api/projects/${project.id}/cases`),
              http.get(`/api/projects/${project.id}/runs`),
              http.get(`/api/projects/${project.id}/suites`),
              http.get(`/api/projects/${project.id}/milestones`),
            ]);
            return {
              project,
              cases: casesRes.data || [],
              runs: runsRes.data || [],
              suites: suitesRes.data || [],
              milestones: milestonesRes.data || [],
            };
          } catch (error) {
            console.error(`Failed to load data for project ${project.id}:`, error);
            return { project, cases: [], runs: [], suites: [], milestones: [] };
          }
        })
      );

      // Aggregate all data
      const allCases = projectsWithData.flatMap((p: any) => p.cases);
      const allRuns = projectsWithData.flatMap((p: any) => p.runs);
      const allSuites = projectsWithData.flatMap((p: any) => p.suites);
      const allMilestones = projectsWithData.flatMap((p: any) => p.milestones);

      // Calculate run status
      const activeRuns = allRuns.filter((r: any) => !r.closed).length;
      const closedRuns = allRuns.filter((r: any) => r.closed).length;

      // Calculate status distribution
      const statusCounts: Record<string, number> = {};
      allCases.forEach((c: any) => {
        const status = c.status || "DRAFT";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Calculate automation status distribution
      const automationStatusCounts: Record<string, number> = {};
      allCases.forEach((c: any) => {
        const status = c.automationStatus || "NOT_AUTOMATED";
        automationStatusCounts[status] = (automationStatusCounts[status] || 0) + 1;
      });

      // Calculate priority distribution
      const priorityCounts: Record<string, number> = {};
      allCases.forEach((c: any) => {
        const priority = c.priority || "MEDIUM";
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      });

      // Calculate automation rate
      const automatedCount = allCases.filter((c: any) => c.automationStatus === "AUTOMATED").length;
      const automationRate = allCases.length > 0 ? (automatedCount / allCases.length) * 100 : 0;

      // Calculate pass rate (from test cases with PASSED status)
      const passedCount = allCases.filter((c: any) => c.status === "PASSED").length;
      const passRate = allCases.length > 0 ? (passedCount / allCases.length) * 100 : 0;

      // Set stats
      setStats({
        totalProjects: filteredProjects.length,
        totalCases: allCases.length,
        totalRuns: allRuns.length,
        totalSuites: allSuites.length,
        totalMilestones: allMilestones.length,
        passRate: Math.round(passRate * 10) / 10,
        automationRate: Math.round(automationRate * 10) / 10,
        activeRuns,
        closedRuns,
      });

      // Set project activity data
      setProjectActivity(
        projectsWithData.slice(0, 10).map((p: any) => ({
          projectName: p.project.name,
          cases: p.cases.length,
          runs: p.runs.length,
          suites: p.suites.length,
        }))
      );

      // Recent runs (last 10)
      const recentRunsData = allRuns
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((run: any) => {
          const projectData = projectsWithData.find((p: any) => p.project.id === run.projectId);
          return {
            id: run.id,
            name: run.name,
            project: projectData?.project.name || "Unknown",
            status: run.closed ? "Closed" : "Active",
            passRate: 0, // Will be calculated if we load run cases
            date: run.createdAt ? new Date(run.createdAt).toISOString().split("T")[0] : "",
          };
        });

      setRecentRuns(recentRunsData);

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function exportToPNG() {
    if (!dashboardRef.current) {
      alert("Dashboard not ready for export");
      return;
    }

    try {
      setExportingPng(true);
      console.log("Starting high-quality PNG export with html-to-image...");

      // Wait for all charts to render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = dashboardRef.current;
      const isDark = document.documentElement.classList.contains('dark');

      // Use html-to-image which handles modern CSS better
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 4, // 4x resolution for high quality
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        cacheBust: true,
        skipFonts: false,
      });

      console.log("High-quality PNG created, downloading...");

      // Download the image
      const link = document.createElement("a");
      link.download = `Messagepoint-TMS-Dashboard-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();

      console.log("High-quality PNG export completed!");
    } catch (error) {
      console.error("Failed to export PNG:", error);
      alert(`Failed to export PNG: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setExportingPng(false);
    }
  }

  async function exportToPDF() {
    if (!dashboardRef.current) {
      alert("Dashboard not ready for export");
      return;
    }

    try {
      setExportingPdf(true);
      console.log("Starting high-quality PDF export with html-to-image...");

      // Wait for all charts to render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = dashboardRef.current;
      const isDark = document.documentElement.classList.contains('dark');

      // Use html-to-image to capture the dashboard
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 3, // 3x resolution for PDF
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        cacheBust: true,
        skipFonts: false,
      });

      console.log("Image created, generating PDF...");

      // Create an image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calculate dimensions
      const imgWidth = img.width;
      const imgHeight = img.height;

      // A4 dimensions in pixels at 72 DPI
      const a4Width = 297; // mm
      const a4Height = 210; // mm (landscape)

      // Determine orientation based on aspect ratio
      const isPortrait = imgHeight > imgWidth;
      const pageWidth = isPortrait ? a4Height : a4Width;
      const pageHeight = isPortrait ? a4Width : a4Height;

      // Create PDF
      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Calculate scaling to fit the page
      const margin = 10;
      const maxWidth = pageWidth - (2 * margin);
      const maxHeight = pageHeight - 40; // Leave space for header and footer

      const widthRatio = maxWidth / (imgWidth / 3); // Divide by scale factor
      const heightRatio = maxHeight / (imgHeight / 3);
      const ratio = Math.min(widthRatio, heightRatio);

      const finalWidth = (imgWidth / 3) * ratio;
      const finalHeight = (imgHeight / 3) * ratio;

      // Center the image
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = 30;

      // Add header with branding
      pdf.setFontSize(18);
      pdf.setTextColor(124, 26, 135); // Brand color #7c1a87
      pdf.text('Messagepoint TMS', margin, 15);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Dashboard Report', margin, 22);

      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(date, pageWidth - margin, 15, { align: 'right' });

      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 25, pageWidth - margin, 25);

      // Add the dashboard image
      pdf.addImage(
        dataUrl,
        'PNG',
        xOffset,
        yOffset,
        finalWidth,
        finalHeight,
        undefined,
        'FAST'
      );

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page 1 of 1 • Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );

      // Save the PDF
      const filename = `Messagepoint-TMS-Dashboard-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(filename);

      console.log("High-quality PDF export completed!");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setExportingPdf(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header with Export Buttons */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Analytics and insights</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToPNG}
              disabled={exportingPng}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium leading-none transition-all duration-150 focus:outline-none focus-visible:ring-2 bg-white/90 text-slate-900 border-slate-300 hover:-translate-y-0.5 hover:bg-white hover:border-slate-400 hover:shadow-sm dark:bg-[#0b1222]/80 dark:text-white dark:border-slate-700/60 dark:hover:bg-[#0e1a2c] dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Download className={`w-4 h-4 ${exportingPng ? 'animate-bounce' : ''}`} />
              <span>{exportingPng ? "Generating PNG..." : "Export PNG"}</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={exportingPdf}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium leading-none transition-all duration-150 focus:outline-none focus-visible:ring-2 bg-white/90 text-slate-900 border-slate-300 hover:-translate-y-0.5 hover:bg-white hover:border-slate-400 hover:shadow-sm dark:bg-[#0b1222]/80 dark:text-white dark:border-slate-700/60 dark:hover:bg-[#0e1a2c] dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Download className={`w-4 h-4 ${exportingPdf ? 'animate-bounce' : ''}`} />
              <span>{exportingPdf ? "Generating PDF..." : "Export PDF"}</span>
            </button>
          </div>
        </div>

        {/* Project Filter */}
        <ProjectFilter
          projects={projects}
          selectedProjectIds={selectedProjectIds}
          onChange={setSelectedProjectIds}
        />
      </div>

      {/* Dashboard Content */}
      <div ref={dashboardRef} data-export-target className="p-4 bg-slate-50 dark:bg-slate-900">
        {/* Compact KPI Cards - Single Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
          <CompactKPICard title="Projects" value={stats.totalProjects} color="#7c1a87" />
          <CompactKPICard title="Test Cases" value={stats.totalCases} color="#7c1a87" />
          <CompactKPICard title="Runs" value={stats.totalRuns} color="#3b82f6" />
          <CompactKPICard title="Pass Rate" value={`${stats.passRate}%`} color="#10b981" />
          <CompactKPICard title="Automation" value={`${stats.automationRate}%`} color="#7c1a87" />
          <CompactKPICard title="Suites" value={stats.totalSuites} color="#8b5cf6" />
          <CompactKPICard title="Active" value={stats.activeRuns} color="#3b82f6" />
          <CompactKPICard title="Closed" value={stats.closedRuns} color="#6b7280" />
        </div>

        {/* Jira Statistics - Real Data Only */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          {/* Types of Bugs - Pie Chart */}
          <CompactChartCard title="Types of Bugs">
            <BugTypesPieChart jiraStats={jiraStats} />
          </CompactChartCard>

          {/* Status Defects - Donut Chart */}
          <CompactChartCard title="Status Defects">
            <StatusDefectsChart jiraStats={jiraStats} />
          </CompactChartCard>

          {/* Report Defects - Horizontal Bar Chart */}
          <CompactChartCard title="Report Defects (by Author)">
            <ReportDefectsChart jiraStats={jiraStats} />
          </CompactChartCard>

          {/* Priority Defects - Donut Chart */}
          <CompactChartCard title="Defects by Priority">
            <PriorityDefectsChart jiraStats={jiraStats} />
          </CompactChartCard>
        </div>

        {/* Test Management Statistics - Real Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Automation Coverage */}
          <CompactChartCard title="Automation Coverage">
            <AutomationGaugeChart value={stats.automationRate} />
          </CompactChartCard>

          {/* Run Status */}
          <CompactChartCard title="Run Status">
            <RunStatusChart activeRuns={stats.activeRuns} closedRuns={stats.closedRuns} />
          </CompactChartCard>
        </div>

        {/* Project Activity - Real Data */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <CompactChartCard title="Project Activity">
            <ProjectActivityChart data={projectActivity} />
          </CompactChartCard>
        </div>
      </div>
    </div>
  );
}

// Compact KPI Card Component
function CompactKPICard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3 hover:shadow-md transition-all hover:scale-105">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

// Compact Chart Card Component
function CompactChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

// Test Execution Trend Chart (Line Chart)
function TestExecutionTrendChart({ data }: { data: TestResult[] }) {
  const isDark = document.documentElement.classList.contains('dark');

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
    },
    legend: {
      data: ["Passed", "Failed", "Blocked"],
      bottom: 0,
      textStyle: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((d) => d.date),
      axisLine: {
        lineStyle: {
          color: isDark ? '#475569' : '#cbd5e1',
        },
      },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: isDark ? '#475569' : '#cbd5e1',
        },
      },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#334155' : '#e2e8f0',
        },
      },
    },
    series: [
      {
        name: "Passed",
        type: "line",
        smooth: true,
        data: data.map((d) => d.passed),
        itemStyle: { color: "#10b981" },
        areaStyle: { color: "rgba(16, 185, 129, 0.2)" },
      },
      {
        name: "Failed",
        type: "line",
        smooth: true,
        data: data.map((d) => d.failed),
        itemStyle: { color: "#ef4444" },
        areaStyle: { color: "rgba(239, 68, 68, 0.2)" },
      },
      {
        name: "Blocked",
        type: "line",
        smooth: true,
        data: data.map((d) => d.blocked),
        itemStyle: { color: "#f59e0b" },
        areaStyle: { color: "rgba(245, 158, 11, 0.2)" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "250px" }} />;
}

// Defects by Project - Grouped Bar Chart
function DefectsByProjectChart({ data }: { data: ProjectActivity[] }) {
  const isDark = document.documentElement.classList.contains('dark');

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      data: ["Created", "Resolved"],
      top: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
    },
    grid: { left: "3%", right: "4%", bottom: "10%", top: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: data.slice(0, 4).map((d) => d.projectName.substring(0, 10)),
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
    },
    series: [
      {
        name: "Created",
        type: "bar",
        data: data.slice(0, 4).map((d) => d.cases),
        itemStyle: { color: "#10b981" },
        barWidth: '35%',
      },
      {
        name: "Resolved",
        type: "bar",
        data: data.slice(0, 4).map((d) => Math.floor(d.cases * 0.7)),
        itemStyle: { color: "#3b82f6" },
        barWidth: '35%',
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Defects Trend - Dual Line Chart
function DefectsTrendChart({ data }: { data: TestResult[] }) {
  const isDark = document.documentElement.classList.contains('dark');

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      data: ["Planned", "Actual"],
      top: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
    },
    grid: { left: "3%", right: "4%", bottom: "10%", top: "15%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((d) => d.date.substring(5)),
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
    },
    series: [
      {
        name: "Planned",
        type: "line",
        smooth: true,
        data: data.map((d) => d.passed + d.failed),
        itemStyle: { color: "#10b981" },
        lineStyle: { width: 2 },
      },
      {
        name: "Actual",
        type: "line",
        smooth: true,
        data: data.map((d) => d.failed),
        itemStyle: { color: "#ef4444" },
        lineStyle: { width: 2 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Bug Types Pie Chart
function BugTypesPieChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains('dark');

  console.log("BugTypesPieChart - jiraStats:", jiraStats);

  // Use real Jira data if available, otherwise use mock data
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const bugTypes = jiraStats && jiraStats.byIssueType
    ? Object.entries(jiraStats.byIssueType).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
    : [
        { name: "System bug", value: 15, color: "#10b981" },
        { name: "Functional bug", value: 25, color: "#3b82f6" },
        { name: "Unit level bug", value: 10, color: "#f59e0b" },
        { name: "Logical bugs", value: 20, color: "#ef4444" },
      ];

  console.log("BugTypesPieChart - bugTypes:", bugTypes);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      orient: "vertical",
      right: 5,
      top: "center",
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        center: ["35%", "50%"],
        data: bugTypes,
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Status Defects - Donut Chart
function StatusDefectsChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains('dark');

  // Use real Jira data if available, otherwise use mock data
  const colors = ["#f59e0b", "#3b82f6", "#10b981", "#6b7280", "#8b5cf6", "#ec4899"];
  const statusData = jiraStats && jiraStats.byStatus
    ? Object.entries(jiraStats.byStatus).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
    : [
        { name: "On hold", value: 8, color: "#f59e0b" },
        { name: "In progress", value: 12, color: "#3b82f6" },
        { name: "Validated", value: 25, color: "#10b981" },
        { name: "Closed", value: 5, color: "#6b7280" },
      ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      orient: "vertical",
      right: 5,
      top: "center",
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "70%"],
        center: ["35%", "50%"],
        data: statusData,
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Report Defects - Horizontal Bar Chart (by Author)
function ReportDefectsChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains('dark');

  // Use real Jira data if available, otherwise use mock data
  const reportData = jiraStats && jiraStats.byAuthor
    ? Object.entries(jiraStats.byAuthor)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10 authors
    : [
        { name: "Development team", value: 55 },
        { name: "Customer", value: 34 },
        { name: "Quality assurance(QA) team", value: 23 },
        { name: "User acceptance testing (UAT) team", value: 8 },
      ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    grid: { left: "35%", right: "10%", top: "5%", bottom: "5%", containLabel: false },
    xAxis: {
      type: "value",
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
    },
    yAxis: {
      type: "category",
      data: reportData.map(d => d.name),
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 9 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: reportData.map(d => d.value),
        itemStyle: { color: "#10b981" },
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 10,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Priority Defects - Donut Chart
function PriorityDefectsChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains('dark');

  // Use real Jira data if available, otherwise use mock data
  const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];
  const priorityData = jiraStats && jiraStats.byPriority
    ? Object.entries(jiraStats.byPriority).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
    : [
        { name: "Critical", value: 12, color: "#ef4444" },
        { name: "High", value: 18, color: "#f59e0b" },
        { name: "Medium", value: 25, color: "#3b82f6" },
        { name: "Low", value: 15, color: "#10b981" },
      ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      orient: "vertical",
      right: 5,
      top: "center",
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "70%"],
        center: ["35%", "50%"],
        data: priorityData,
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Time Period Defects - Grouped Bar Chart
function TimePeriodDefectsChart({ data }: { data: ProjectActivity[] }) {
  const isDark = document.documentElement.classList.contains('dark');

  const periods = ["May-20", "May-25", "Jun-20", "Jun-25", "Jul-20", "Aug-20"];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      data: ["Critical", "High", "Low", "Normal", "Release-Blocker"],
      top: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 9 },
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { left: "3%", right: "4%", bottom: "10%", top: "20%", containLabel: true },
    xAxis: {
      type: "category",
      data: periods,
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
    },
    series: [
      {
        name: "Critical",
        type: "bar",
        data: [15, 18, 20, 22, 25, 28],
        itemStyle: { color: "#ef4444" },
        barWidth: '12%',
      },
      {
        name: "High",
        type: "bar",
        data: [12, 15, 18, 20, 22, 25],
        itemStyle: { color: "#f59e0b" },
        barWidth: '12%',
      },
      {
        name: "Low",
        type: "bar",
        data: [8, 10, 12, 14, 16, 18],
        itemStyle: { color: "#10b981" },
        barWidth: '12%',
      },
      {
        name: "Normal",
        type: "bar",
        data: [10, 12, 14, 16, 18, 20],
        itemStyle: { color: "#3b82f6" },
        barWidth: '12%',
      },
      {
        name: "Release-Blocker",
        type: "bar",
        data: [5, 6, 7, 8, 9, 10],
        itemStyle: { color: "#8b5cf6" },
        barWidth: '12%',
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Test Status Pie Chart (Production Level)
function TestStatusPieChart({ data }: { data: TestCaseStatus[] }) {
  const isDark = document.documentElement.classList.contains('dark');
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${params.color};"></div>
              <span>${params.value} cases (${params.percent}%)</span>
            </div>
          </div>
        `;
      },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
      extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px;',
    },
    legend: {
      orient: "horizontal",
      bottom: 5,
      left: "center",
      itemGap: 16,
      textStyle: {
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: 12,
      },
      icon: 'circle',
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: total.toString(),
          textAlign: 'center',
          fill: isDark ? '#e2e8f0' : '#1e293b',
          fontSize: 32,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '50%',
        style: {
          text: 'Total Cases',
          textAlign: 'center',
          fill: isDark ? '#94a3b8' : '#64748b',
          fontSize: 14,
        },
      },
    ],
    series: [
      {
        name: "Test Status",
        type: "pie",
        radius: ["60%", "75%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 0, 0, 0.25)',
          },
        },
        labelLine: {
          show: false,
        },
        animationType: 'scale',
        animationEasing: 'cubicOut',
        animationDelay: (idx: number) => idx * 80,
        data: data.map((item) => ({
          value: item.count,
          name: item.status,
          itemStyle: {
            color:
              item.status === "PASSED"
                ? "#10b981"
                : item.status === "FAILED"
                ? "#ef4444"
                : item.status === "BLOCKED"
                ? "#f59e0b"
                : item.status === "IN_PROGRESS"
                ? "#3b82f6"
                : "#6b7280",
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Automation Coverage - Vertical Bar Chart
function AutomationGaugeChart({ value }: { value: number }) {
  const isDark = document.documentElement.classList.contains('dark');
  const automated = value;
  const notAutomated = 100 - value;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const item = params[0];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color};"></div>
              <span>${item.value}%</span>
            </div>
          </div>
        `;
      },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    grid: {
      left: "15%",
      right: "10%",
      top: "10%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["Automated", "Not Automated"],
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: 11,
        interval: 0,
        rotate: 0,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      max: 100,
      axisLine: { show: false },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
        formatter: '{value}%',
      },
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
    },
    series: [
      {
        type: "bar",
        barWidth: "50%",
        data: [
          {
            value: automated,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#8b5cf6' },
                { offset: 1, color: '#7c1a87' },
              ]),
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c}%',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          {
            value: notAutomated,
            itemStyle: {
              color: isDark ? '#334155' : '#e2e8f0',
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c}%',
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Severity Bar Chart
function SeverityBarChart({ data }: { data: SeverityData[] }) {
  const isDark = document.documentElement.classList.contains('dark');

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
    },
    legend: {
      data: ["Passed", "Failed"],
      bottom: 0,
      textStyle: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: isDark ? '#475569' : '#cbd5e1',
        },
      },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#334155' : '#e2e8f0',
        },
      },
    },
    yAxis: {
      type: "category",
      data: data.map((d) => d.severity),
      axisLine: {
        lineStyle: {
          color: isDark ? '#475569' : '#cbd5e1',
        },
      },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
    },
    series: [
      {
        name: "Passed",
        type: "bar",
        stack: "total",
        data: data.map((d) => d.passed),
        itemStyle: { color: "#10b981" },
      },
      {
        name: "Failed",
        type: "bar",
        stack: "total",
        data: data.map((d) => d.failed),
        itemStyle: { color: "#ef4444" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Recent Runs Table (AG Grid)
function RecentRunsTable({ data }: { data: any[] }) {
  const columnDefs = [
    {
      field: "name",
      headerName: "Run Name",
      flex: 2,
      cellStyle: { fontWeight: 600 },
    },
    {
      field: "project",
      headerName: "Project",
      flex: 1,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      cellRenderer: (params: any) => {
        const status = params.value;
        const isDarkMode = document.documentElement.classList.contains('dark');
        const colors: any = {
          "Active": isDarkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800",
          "Closed": isDarkMode ? "bg-gray-700/50 text-gray-300" : "bg-gray-100 text-gray-800",
        };
        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colors[status] || (isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-800')}">${status}</span>`;
      },
    },
    {
      field: "passRate",
      headerName: "Pass Rate",
      flex: 1,
      cellRenderer: (params: any) => {
        const value = params.value;
        const color = value >= 90 ? "#10b981" : value >= 70 ? "#f59e0b" : "#ef4444";
        const isDarkMode = document.documentElement.classList.contains('dark');
        const bgColor = isDarkMode ? '#334155' : '#e5e7eb';
        return `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; height: 8px; background: ${bgColor}; border-radius: 4px; overflow: hidden;">
              <div style="width: ${value}%; height: 100%; background: ${color};"></div>
            </div>
            <span style="font-weight: 600; color: ${color};">${value}%</span>
          </div>
        `;
      },
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
    },
  ];

  return (
    <div className="ag-theme-alpine dark:ag-theme-alpine-auto" style={{ height: 400, width: "100%" }}>
      <style>{`
        .dark .ag-theme-alpine {
          --ag-background-color: #1e293b;
          --ag-header-background-color: #0f172a;
          --ag-odd-row-background-color: #1e293b;
          --ag-row-hover-color: #334155;
          --ag-foreground-color: #e2e8f0;
          --ag-border-color: #475569;
          --ag-secondary-foreground-color: #94a3b8;
          --ag-header-foreground-color: #f1f5f9;
        }
      `}</style>
      <AgGridReact
        rowData={data}
        columnDefs={columnDefs}
        domLayout="normal"
        rowHeight={50}
        headerHeight={45}
      />
    </div>
  );
}

// Automation Status Pie Chart (Production Level)
function AutomationStatusPieChart({ data }: { data: AutomationStatusData[] }) {
  const isDark = document.documentElement.classList.contains('dark');
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const automatedCount = data.find(d => d.status === "AUTOMATED")?.count || 0;
  const automationRate = total > 0 ? Math.round((automatedCount / total) * 100) : 0;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${params.color};"></div>
              <span>${params.value} cases (${params.percent}%)</span>
            </div>
          </div>
        `;
      },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
      extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px;',
    },
    legend: {
      orient: "horizontal",
      bottom: 5,
      left: "center",
      itemGap: 16,
      textStyle: {
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: 12,
      },
      icon: 'circle',
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: `${automationRate}%`,
          textAlign: 'center',
          fill: '#10b981',
          fontSize: 32,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '50%',
        style: {
          text: 'Automated',
          textAlign: 'center',
          fill: isDark ? '#94a3b8' : '#64748b',
          fontSize: 14,
        },
      },
    ],
    series: [
      {
        name: "Automation Status",
        type: "pie",
        radius: ["60%", "75%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 0, 0, 0.25)',
          },
        },
        labelLine: {
          show: false,
        },
        animationType: 'scale',
        animationEasing: 'cubicOut',
        animationDelay: (idx: number) => idx * 80,
        data: data.map((item) => ({
          value: item.count,
          name: item.status,
          itemStyle: {
            color:
              item.status === "AUTOMATED"
                ? "#10b981"
                : item.status === "IN_PROGRESS"
                ? "#f59e0b"
                : "#6b7280",
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Priority Pie Chart (Production Level)
function PriorityPieChart({ data }: { data: PriorityData[] }) {
  const isDark = document.documentElement.classList.contains('dark');
  const criticalCount = data.find(d => d.priority === "CRITICAL")?.count || 0;
  const highCount = data.find(d => d.priority === "HIGH")?.count || 0;
  const urgentCount = criticalCount + highCount;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${params.color};"></div>
              <span>${params.value} cases (${params.percent}%)</span>
            </div>
          </div>
        `;
      },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
      extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px;',
    },
    legend: {
      orient: "horizontal",
      bottom: 5,
      left: "center",
      itemGap: 16,
      textStyle: {
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: 12,
      },
      icon: 'circle',
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: urgentCount.toString(),
          textAlign: 'center',
          fill: '#ef4444',
          fontSize: 32,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '50%',
        style: {
          text: 'High Priority',
          textAlign: 'center',
          fill: isDark ? '#94a3b8' : '#64748b',
          fontSize: 14,
        },
      },
    ],
    series: [
      {
        name: "Priority",
        type: "pie",
        radius: ["60%", "75%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 0, 0, 0.25)',
          },
        },
        labelLine: {
          show: false,
        },
        animationType: 'scale',
        animationEasing: 'cubicOut',
        animationDelay: (idx: number) => idx * 80,
        data: data.map((item) => ({
          value: item.count,
          name: item.priority,
          itemStyle: {
            color:
              item.priority === "CRITICAL"
                ? "#ef4444"
                : item.priority === "HIGH"
                ? "#f59e0b"
                : item.priority === "MEDIUM"
                ? "#3b82f6"
                : "#6b7280",
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Run Status Chart - Horizontal Stacked Bar
function RunStatusChart({ activeRuns, closedRuns }: { activeRuns: number; closedRuns: number }) {
  const isDark = document.documentElement.classList.contains('dark');
  const total = activeRuns + closedRuns;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        let result = '<div style="padding: 8px;">';
        result += '<div style="font-weight: 600; margin-bottom: 8px;">Run Status</div>';
        params.forEach((item: any) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color};"></div>
              <span>${item.seriesName}: ${item.value} (${percent}%)</span>
            </div>
          `;
        });
        result += '</div>';
        return result;
      },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      data: ["Active", "Closed"],
      bottom: 0,
      left: "center",
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
    },
    grid: {
      left: "5%",
      right: "5%",
      top: "15%",
      bottom: "20%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      max: total || 100,
      axisLine: { show: false },
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: ["Runs"],
      axisLine: { show: false },
      axisLabel: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "Active",
        type: "bar",
        stack: "total",
        barWidth: "60%",
        data: [activeRuns],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#10b981' },
            { offset: 1, color: '#059669' },
          ]),
          borderRadius: [6, 0, 0, 6],
        },
        label: {
          show: true,
          position: 'inside',
          formatter: () => {
            const percent = total > 0 ? Math.round((activeRuns / total) * 100) : 0;
            return activeRuns > 0 ? `${activeRuns} (${percent}%)` : '';
          },
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 'bold',
        },
      },
      {
        name: "Closed",
        type: "bar",
        stack: "total",
        data: [closedRuns],
        itemStyle: {
          color: isDark ? '#334155' : '#e2e8f0',
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'inside',
          formatter: () => {
            const percent = total > 0 ? Math.round((closedRuns / total) * 100) : 0;
            return closedRuns > 0 ? `${closedRuns} (${percent}%)` : '';
          },
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 13,
          fontWeight: 'bold',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

// Project Activity Chart (Grouped Bar Chart)
function ProjectActivityChart({ data }: { data: ProjectActivity[] }) {
  const isDark = document.documentElement.classList.contains('dark');

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#e2e8f0' : '#1e293b',
      },
    },
    legend: {
      data: ["Test Cases", "Test Runs", "Test Suites"],
      bottom: 0,
      textStyle: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.projectName),
      axisLabel: {
        interval: 0,
        rotate: 45,
        color: isDark ? '#94a3b8' : '#64748b',
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#475569' : '#cbd5e1',
        },
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: isDark ? '#475569' : '#cbd5e1',
        },
      },
      axisLabel: {
        color: isDark ? '#94a3b8' : '#64748b',
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#334155' : '#e2e8f0',
        },
      },
    },
    series: [
      {
        name: "Test Cases",
        type: "bar",
        data: data.map((d) => d.cases),
        itemStyle: { color: "#7c1a87" },
      },
      {
        name: "Test Runs",
        type: "bar",
        data: data.map((d) => d.runs),
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "Test Suites",
        type: "bar",
        data: data.map((d) => d.suites),
        itemStyle: { color: "#8b5cf6" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "250px" }} />;
}

// Project Filter Component
function ProjectFilter({
  projects,
  selectedProjectIds,
  onChange,
}: {
  projects: any[];
  selectedProjectIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleProject = (projectId: number) => {
    if (selectedProjectIds.includes(projectId)) {
      onChange(selectedProjectIds.filter((id) => id !== projectId));
    } else {
      onChange([...selectedProjectIds, projectId]);
    }
  };

  const selectAll = () => {
    onChange(projects.map((p) => p.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const displayText = selectedProjectIds.length === 0
    ? "All Projects"
    : selectedProjectIds.length === projects.length
    ? "All Projects"
    : `${selectedProjectIds.length} Project${selectedProjectIds.length > 1 ? 's' : ''}`;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Filter:</span>

        {/* Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{displayText}</span>
        </button>

        {/* Selected Project Chips */}
        {selectedProjectIds.length > 0 && selectedProjectIds.length < projects.length && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedProjectIds.slice(0, 3).map((id) => {
              const project = projects.find((p) => p.id === id);
              if (!project) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  {project.name}
                  <button
                    onClick={() => toggleProject(id)}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {selectedProjectIds.length > 3 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                +{selectedProjectIds.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Select Projects
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Project List */}
            <div className="overflow-y-auto flex-1">
              {projects.map((project) => {
                const isSelected = selectedProjectIds.includes(project.id);
                return (
                  <label
                    key={project.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProject(project.id)}
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {project.name}
                      </div>
                      {project.groupName && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {project.groupName}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
