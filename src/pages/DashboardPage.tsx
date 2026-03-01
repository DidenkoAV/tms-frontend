import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { http } from "@/lib/http";
import { Download, Filter, X } from "lucide-react";
import { useMe } from "@/features/account/hooks/useMe";
import { useToast } from "@/shared/ui/alert";

interface DashboardStats {
  totalProjects: number;
  totalCases: number;
  totalRuns: number;
  totalSuites: number;
  passRate: number;
  automationRate: number;
  activeRuns: number;
  closedRuns: number;
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

type DashboardProject = {
  id: number;
  name: string;
  groupName?: string;
  project?: { id: number };
};

const DEFAULT_STATS: DashboardStats = {
  totalProjects: 0,
  totalCases: 0,
  totalRuns: 0,
  totalSuites: 0,
  passRate: 0,
  automationRate: 0,
  activeRuns: 0,
  closedRuns: 0,
};

const DashboardChartsSection = lazy(
  () => import("@/features/dashboard/ui/DashboardChartsSection")
);

export default function DashboardPage() {
  const { me } = useMe();
  const toast = useToast();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const loadSeqRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [debouncedSelectedProjectIds, setDebouncedSelectedProjectIds] =
    useState<number[]>([]);
  const [jiraStats, setJiraStats] = useState<DetailedIssueStats | null>(null);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [projectActivity, setProjectActivity] = useState<ProjectActivity[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSelectedProjectIds(selectedProjectIds),
      250
    );
    return () => window.clearTimeout(timer);
  }, [selectedProjectIds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data: projectsData } = await http.get<DashboardProject[]>(
          "/api/projects/all"
        );
        if (cancelled) return;
        setProjects(projectsData ?? []);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load projects for dashboard:", error);
          setProjects([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me?.id, me?.currentGroupId]);

  const filteredProjects = useMemo(() => {
    if (!projects.length) return [];
    return debouncedSelectedProjectIds.length > 0
      ? projects.filter((p) => debouncedSelectedProjectIds.includes(p.id))
      : projects;
  }, [projects, debouncedSelectedProjectIds]);

  const loadDashboardData = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    try {
      setLoading(true);

      if (!projects.length || !filteredProjects.length) {
        if (seq !== loadSeqRef.current) return;
        setJiraStats(null);
        setStats(DEFAULT_STATS);
        setProjectActivity([]);
        return;
      }

      const groupId = me?.currentGroupId ?? me?.groups?.[0]?.id;

      if (groupId) {
        try {
          const projectIds = filteredProjects.map((p) => p.project?.id || p.id);
          const url = `/api/integrations/jira/projects-stats-detailed/${groupId}`;
          const params = new URLSearchParams();
          projectIds.forEach((id) => params.append("projectIds", id.toString()));
          const { data: jiraStatsData } = await http.get(
            `${url}?${params.toString()}`
          );
          if (seq !== loadSeqRef.current) return;
          setJiraStats(jiraStatsData);
        } catch (error) {
          if (seq !== loadSeqRef.current) return;
          console.error("Failed to load Jira statistics:", error);
          setJiraStats(null);
        }
      } else {
        setJiraStats(null);
      }

      const loadProjectData = async (project: DashboardProject) => {
        try {
          const [casesRes, runsRes, suitesRes] = await Promise.all([
            http.get(`/api/projects/${project.id}/cases`),
            http.get(`/api/projects/${project.id}/runs`),
            http.get(`/api/projects/${project.id}/suites`),
          ]);
          return {
            project,
            cases: casesRes.data || [],
            runs: runsRes.data || [],
            suites: suitesRes.data || [],
          };
        } catch (error) {
          console.error(`Failed to load data for project ${project.id}:`, error);
          return { project, cases: [], runs: [], suites: [] };
        }
      };

      const projectsWithData: Array<{
        project: DashboardProject;
        cases: any[];
        runs: any[];
        suites: any[];
      }> = [];
      const CONCURRENCY = 4;
      for (let i = 0; i < filteredProjects.length; i += CONCURRENCY) {
        const batch = filteredProjects.slice(i, i + CONCURRENCY);
        const loadedBatch = await Promise.all(batch.map(loadProjectData));
        projectsWithData.push(...loadedBatch);
      }
      if (seq !== loadSeqRef.current) return;

      const allCases = projectsWithData.flatMap((p) => p.cases);
      const allRuns = projectsWithData.flatMap((p) => p.runs);
      const allSuites = projectsWithData.flatMap((p) => p.suites);

      const activeRuns = allRuns.filter((r: any) => !r.closed).length;
      const closedRuns = allRuns.filter((r: any) => r.closed).length;

      const automatedCount = allCases.filter(
        (c: any) => c.automationStatus === "AUTOMATED"
      ).length;
      const automationRate =
        allCases.length > 0 ? (automatedCount / allCases.length) * 100 : 0;

      const passedCount = allCases.filter((c: any) => c.status === "PASSED").length;
      const passRate = allCases.length > 0 ? (passedCount / allCases.length) * 100 : 0;

      setStats({
        totalProjects: filteredProjects.length,
        totalCases: allCases.length,
        totalRuns: allRuns.length,
        totalSuites: allSuites.length,
        passRate: Math.round(passRate * 10) / 10,
        automationRate: Math.round(automationRate * 10) / 10,
        activeRuns,
        closedRuns,
      });

      setProjectActivity(
        projectsWithData.slice(0, 10).map((p) => ({
          projectName: p.project.name,
          cases: p.cases.length,
          runs: p.runs.length,
          suites: p.suites.length,
        }))
      );
    } catch (error) {
      if (seq !== loadSeqRef.current) return;
      console.error("Failed to load dashboard data:", error);
      setStats(DEFAULT_STATS);
      setProjectActivity([]);
      setJiraStats(null);
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, [filteredProjects, me?.currentGroupId, me?.groups, projects.length]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const exportToPNG = useCallback(async () => {
    if (!dashboardRef.current) {
      toast.warning("Dashboard is not ready for export yet");
      return;
    }

    try {
      setExportingPng(true);
      const htmlToImage = await import("html-to-image");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = dashboardRef.current;
      const isDark = document.documentElement.classList.contains("dark");

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 4,
        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        cacheBust: true,
        skipFonts: false,
      });

      const link = document.createElement("a");
      link.download = `Messagepoint-TMS-Dashboard-${new Date()
        .toISOString()
        .split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export PNG:", error);
      toast.error(
        `Failed to export PNG: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setExportingPng(false);
    }
  }, [toast]);

  const exportToPDF = useCallback(async () => {
    if (!dashboardRef.current) {
      toast.warning("Dashboard is not ready for export yet");
      return;
    }

    try {
      setExportingPdf(true);
      const htmlToImage = await import("html-to-image");
      const { default: JsPdf } = await import("jspdf");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = dashboardRef.current;
      const isDark = document.documentElement.classList.contains("dark");

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 3,
        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        cacheBust: true,
        skipFonts: false,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = img.width;
      const imgHeight = img.height;

      const a4Width = 297;
      const a4Height = 210;
      const isPortrait = imgHeight > imgWidth;
      const pageWidth = isPortrait ? a4Height : a4Width;
      const pageHeight = isPortrait ? a4Width : a4Height;

      const pdf = new JsPdf({
        orientation: isPortrait ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const margin = 10;
      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight - 40;

      const widthRatio = maxWidth / (imgWidth / 3);
      const heightRatio = maxHeight / (imgHeight / 3);
      const ratio = Math.min(widthRatio, heightRatio);

      const finalWidth = (imgWidth / 3) * ratio;
      const finalHeight = (imgHeight / 3) * ratio;

      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = 30;

      pdf.setFontSize(18);
      pdf.setTextColor(124, 26, 135);
      pdf.text("Messagepoint TMS", margin, 15);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Dashboard Report", margin, 22);

      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      pdf.text(date, pageWidth - margin, 15, { align: "right" });

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 25, pageWidth - margin, 25);

      pdf.addImage(dataUrl, "PNG", xOffset, yOffset, finalWidth, finalHeight, undefined, "FAST");

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page 1 of 1 • Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );

      const filename = `Messagepoint-TMS-Dashboard-${new Date()
        .toISOString()
        .split("T")[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error(
        `Failed to export PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setExportingPdf(false);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
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
              <Download className={`w-4 h-4 ${exportingPng ? "animate-bounce" : ""}`} />
              <span>{exportingPng ? "Generating PNG..." : "Export PNG"}</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={exportingPdf}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium leading-none transition-all duration-150 focus:outline-none focus-visible:ring-2 bg-white/90 text-slate-900 border-slate-300 hover:-translate-y-0.5 hover:bg-white hover:border-slate-400 hover:shadow-sm dark:bg-[#0b1222]/80 dark:text-white dark:border-slate-700/60 dark:hover:bg-[#0e1a2c] dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Download className={`w-4 h-4 ${exportingPdf ? "animate-bounce" : ""}`} />
              <span>{exportingPdf ? "Generating PDF..." : "Export PDF"}</span>
            </button>
          </div>
        </div>

        <ProjectFilter
          projects={projects}
          selectedProjectIds={selectedProjectIds}
          onChange={setSelectedProjectIds}
        />
      </div>

      <div ref={dashboardRef} data-export-target className="p-4 bg-slate-50 dark:bg-slate-900">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse" />
              <div className="h-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse" />
            </div>
          }
        >
          <DashboardChartsSection
            stats={stats}
            jiraStats={jiraStats}
            projectActivity={projectActivity}
          />
        </Suspense>
      </div>
    </div>
  );
}

function ProjectFilter({
  projects,
  selectedProjectIds,
  onChange,
}: {
  projects: DashboardProject[];
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

  const displayText =
    selectedProjectIds.length === 0 || selectedProjectIds.length === projects.length
      ? "All Projects"
      : `${selectedProjectIds.length} Project${
          selectedProjectIds.length > 1 ? "s" : ""
        }`;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Filter:</span>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{displayText}</span>
        </button>

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

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden flex flex-col">
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
