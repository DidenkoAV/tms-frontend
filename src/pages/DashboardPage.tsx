import { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { http } from "@/lib/http";
import { Download } from "lucide-react";

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

export default function DashboardPage() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
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
  const [statusData, setStatusData] = useState<TestCaseStatus[]>([]);
  const [trendData, setTrendData] = useState<TestResult[]>([]);
  const [severityData, setSeverityData] = useState<SeverityData[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [automationStatusData, setAutomationStatusData] = useState<AutomationStatusData[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityData[]>([]);
  const [projectActivity, setProjectActivity] = useState<ProjectActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

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

      // Save projects to state for PDF export
      setProjects(projectsData);

      // Load data for all projects in parallel
      const projectsWithData = await Promise.all(
        projectsData.map(async (project: any) => {
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
        totalProjects: projects.length,
        totalCases: allCases.length,
        totalRuns: allRuns.length,
        totalSuites: allSuites.length,
        totalMilestones: allMilestones.length,
        passRate: Math.round(passRate * 10) / 10,
        automationRate: Math.round(automationRate * 10) / 10,
        activeRuns,
        closedRuns,
      });

      // Set automation status data
      setAutomationStatusData(
        Object.entries(automationStatusCounts).map(([status, count]) => ({
          status,
          count,
        }))
      );

      // Set priority data
      setPriorityData(
        Object.entries(priorityCounts).map(([priority, count]) => ({
          priority,
          count,
        }))
      );

      // Set project activity data
      setProjectActivity(
        projectsData.slice(0, 10).map((p) => ({
          projectName: p.project.name,
          cases: p.cases.length,
          runs: p.runs.length,
          suites: p.suites.length,
        }))
      );

      // Set status data for pie chart
      setStatusData(
        Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        }))
      );

      // Generate trend data (last 7 days)
      const trendMap: Record<string, { passed: number; failed: number; blocked: number }> = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        trendMap[dateStr] = { passed: 0, failed: 0, blocked: 0 };
      }

      // Count cases by status and date (using updatedAt as proxy)
      allCases.forEach((c: any) => {
        if (c.updatedAt) {
          const dateStr = c.updatedAt.split("T")[0];
          if (trendMap[dateStr]) {
            if (c.status === "PASSED") trendMap[dateStr].passed++;
            else if (c.status === "FAILED") trendMap[dateStr].failed++;
            else if (c.status === "BLOCKED") trendMap[dateStr].blocked++;
          }
        }
      });

      setTrendData(
        Object.entries(trendMap).map(([date, counts]) => ({
          date,
          ...counts,
        }))
      );

      // Calculate severity distribution
      const severities = ["CRITICAL", "MAJOR", "NORMAL", "MINOR", "TRIVIAL"];
      const severityMap: Record<string, { passed: number; failed: number }> = {};
      severities.forEach((sev) => {
        severityMap[sev] = { passed: 0, failed: 0 };
      });

      allCases.forEach((c: any) => {
        const severity = c.severity || "NORMAL";
        if (severityMap[severity]) {
          if (c.status === "PASSED") {
            severityMap[severity].passed++;
          } else if (c.status === "FAILED") {
            severityMap[severity].failed++;
          }
        }
      });

      setSeverityData(
        severities.map((severity) => ({
          severity,
          passed: severityMap[severity].passed,
          failed: severityMap[severity].failed,
        }))
      );

      // Recent runs (last 10)
      const recentRunsData = allRuns
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((run: any) => {
          const projectData = projectsData.find((p) => p.project.id === run.projectId);
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
    if (!dashboardRef.current) return;

    try {
      console.log("Starting high-quality PNG export...");

      // Dynamic import to avoid Vite issues
      const domtoimage = await import("dom-to-image-more");

      console.log("dom-to-image-more loaded, capturing dashboard at 2x resolution...");

      // Capture at 2x resolution for high quality
      const scale = 2;
      const dataUrl = await domtoimage.toPng(dashboardRef.current, {
        quality: 1,
        bgcolor: "#ffffff",
        width: dashboardRef.current.offsetWidth * scale,
        height: dashboardRef.current.offsetHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${dashboardRef.current.offsetWidth}px`,
          height: `${dashboardRef.current.offsetHeight}px`,
        },
      });

      console.log("High-quality image created, downloading...");

      const link = document.createElement("a");
      link.download = `Messagepoint-TMS-Dashboard-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();

      console.log("High-quality PNG export completed!");
    } catch (error) {
      console.error("Failed to export PNG:", error);
      alert(`Failed to export PNG: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function exportToPDF() {
    if (projects.length === 0) {
      alert("No projects available to export");
      return;
    }

    try {
      setExportingPdf(true);
      console.log("Starting backend PDF export...");

      // Get all project IDs
      const projectIds = projects.map((p: any) => p.id);

      // Call backend API to generate PDF
      const response = await http.post(
        "/api/dashboard/export-pdf",
        { projectIds },
        {
          responseType: "blob", // Important: tell axios to expect binary data
        }
      );

      // Create a blob from the response
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Messagepoint-TMS-Dashboard-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      console.log("Backend PDF export completed!");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Analytics and insights</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToPNG}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium leading-none transition-all duration-150 focus:outline-none focus-visible:ring-2 bg-white/90 text-slate-900 border-slate-300 hover:-translate-y-0.5 hover:bg-white hover:border-slate-400 hover:shadow-sm dark:bg-[#0b1222]/80 dark:text-white dark:border-slate-700/60 dark:hover:bg-[#0e1a2c] dark:hover:border-slate-500"
            >
              <Download className="w-4 h-4" />
              <span>Export PNG</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={exportingPdf}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium leading-none transition-all duration-150 focus:outline-none focus-visible:ring-2 bg-white/90 text-slate-900 border-slate-300 hover:-translate-y-0.5 hover:bg-white hover:border-slate-400 hover:shadow-sm dark:bg-[#0b1222]/80 dark:text-white dark:border-slate-700/60 dark:hover:bg-[#0e1a2c] dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? "Generating PDF..." : "Export PDF"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div ref={dashboardRef} data-export-target className="p-6 bg-slate-50 dark:bg-slate-900">
        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KPICard title="Total Projects" value={stats.totalProjects} color="#7c1a87" />
          <KPICard title="Total Test Cases" value={stats.totalCases} color="#7c1a87" />
          <KPICard title="Total Runs" value={stats.totalRuns} color="#3b82f6" />
          <KPICard title="Pass Rate" value={`${stats.passRate}%`} color="#10b981" />
          <KPICard title="Automation" value={`${stats.automationRate}%`} color="#7c1a87" />
        </div>

        {/* KPI Cards Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="Total Suites" value={stats.totalSuites} color="#8b5cf6" />
          <KPICard title="Total Milestones" value={stats.totalMilestones} color="#ec4899" />
          <KPICard title="Active Runs" value={stats.activeRuns} color="#3b82f6" />
          <KPICard title="Closed Runs" value={stats.closedRuns} color="#6b7280" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Test Execution Trend */}
          <ChartCard title="Test Execution Trend">
            <TestExecutionTrendChart data={trendData} />
          </ChartCard>

          {/* Test Status Distribution */}
          <ChartCard title="Test Status Distribution">
            <TestStatusPieChart data={statusData} />
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Automation Coverage */}
          <ChartCard title="Automation Coverage">
            <AutomationGaugeChart value={stats.automationRate} />
          </ChartCard>

          {/* Test Results by Severity */}
          <ChartCard title="Test Results by Severity">
            <SeverityBarChart data={severityData} />
          </ChartCard>
        </div>

        {/* Charts Row 3 - New Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Automation Status Distribution */}
          <ChartCard title="Automation Status">
            <AutomationStatusPieChart data={automationStatusData} />
          </ChartCard>

          {/* Priority Distribution */}
          <ChartCard title="Priority Distribution">
            <PriorityPieChart data={priorityData} />
          </ChartCard>

          {/* Run Status */}
          <ChartCard title="Run Status">
            <RunStatusChart activeRuns={stats.activeRuns} closedRuns={stats.closedRuns} />
          </ChartCard>
        </div>

        {/* Charts Row 4 - Project Activity */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <ChartCard title="Project Activity">
            <ProjectActivityChart data={projectActivity} />
          </ChartCard>
        </div>

        {/* Recent Test Runs Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Test Runs</h3>
          <RecentRunsTable data={recentRuns} />
        </div>
      </div>
    </div>
  );
}

// KPI Card Component (Modern Contoso Style - No Emojis)
function KPICard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{value}</div>
      <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full" style={{ backgroundColor: color, width: '75%' }}></div>
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
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

  return <ReactECharts option={option} style={{ height: "300px" }} />;
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

  return <ReactECharts option={option} style={{ height: "320px" }} />;
}

// Automation Gauge Chart
function AutomationGaugeChart({ value }: { value: number }) {
  const isDark = document.documentElement.classList.contains('dark');

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: "#7c1a87",
        },
        progress: {
          show: true,
          width: 18,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, isDark ? '#334155' : '#e2e8f0']],
          },
        },
        axisTick: {
          distance: -25,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: isDark ? '#64748b' : '#94a3b8',
          },
        },
        splitLine: {
          distance: -30,
          length: 14,
          lineStyle: {
            width: 3,
            color: isDark ? '#64748b' : '#94a3b8',
          },
        },
        axisLabel: {
          distance: -20,
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 12,
        },
        anchor: {
          show: false,
        },
        title: {
          show: false,
        },
        detail: {
          valueAnimation: true,
          width: "60%",
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, "-15%"],
          fontSize: 40,
          fontWeight: "bolder",
          formatter: "{value}%",
          color: "#7c1a87",
        },
        data: [
          {
            value: value,
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "300px" }} />;
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

  return <ReactECharts option={option} style={{ height: "300px" }} />;
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

  return <ReactECharts option={option} style={{ height: "320px" }} />;
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

  return <ReactECharts option={option} style={{ height: "320px" }} />;
}

// Run Status Chart (Donut - Production Level)
function RunStatusChart({ activeRuns, closedRuns }: { activeRuns: number; closedRuns: number }) {
  const isDark = document.documentElement.classList.contains('dark');
  const total = activeRuns + closedRuns;
  const activeRate = total > 0 ? Math.round((activeRuns / total) * 100) : 0;

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
              <span>${params.value} runs (${params.percent}%)</span>
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
          text: `${activeRate}%`,
          textAlign: 'center',
          fill: '#3b82f6',
          fontSize: 32,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '50%',
        style: {
          text: 'Active Runs',
          textAlign: 'center',
          fill: isDark ? '#94a3b8' : '#64748b',
          fontSize: 14,
        },
      },
    ],
    series: [
      {
        name: "Run Status",
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
        data: [
          {
            value: activeRuns,
            name: "Active",
            itemStyle: { color: "#3b82f6" },
          },
          {
            value: closedRuns,
            name: "Closed",
            itemStyle: { color: "#6b7280" },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "320px" }} />;
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

  return <ReactECharts option={option} style={{ height: "350px" }} />;
}

