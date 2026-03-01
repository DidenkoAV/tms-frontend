import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

type DashboardStats = {
  totalProjects: number;
  totalCases: number;
  totalRuns: number;
  totalSuites: number;
  passRate: number;
  automationRate: number;
  activeRuns: number;
  closedRuns: number;
};

type ProjectActivity = {
  projectName: string;
  cases: number;
  runs: number;
  suites: number;
};

type DetailedIssueStats = {
  total: number;
  byStatus: Record<string, number>;
  byIssueType: Record<string, number>;
  byAuthor: Record<string, number>;
  byPriority: Record<string, number>;
};

type Props = {
  stats: DashboardStats;
  jiraStats: DetailedIssueStats | null;
  projectActivity: ProjectActivity[];
};

export default function DashboardChartsSection({
  stats,
  jiraStats,
  projectActivity,
}: Props) {
  return (
    <>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <CompactChartCard title="Types of Bugs">
          <BugTypesPieChart jiraStats={jiraStats} />
        </CompactChartCard>

        <CompactChartCard title="Status Defects">
          <StatusDefectsChart jiraStats={jiraStats} />
        </CompactChartCard>

        <CompactChartCard title="Report Defects (by Author)">
          <ReportDefectsChart jiraStats={jiraStats} />
        </CompactChartCard>

        <CompactChartCard title="Defects by Priority">
          <PriorityDefectsChart jiraStats={jiraStats} />
        </CompactChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CompactChartCard title="Automation Coverage">
          <AutomationGaugeChart value={stats.automationRate} />
        </CompactChartCard>

        <CompactChartCard title="Run Status">
          <RunStatusChart activeRuns={stats.activeRuns} closedRuns={stats.closedRuns} />
        </CompactChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <CompactChartCard title="Project Activity">
          <ProjectActivityChart data={projectActivity} />
        </CompactChartCard>
      </div>
    </>
  );
}

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

function CompactChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function BugTypesPieChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains("dark");
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

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderColor: isDark ? "#475569" : "#e2e8f0",
      textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" },
    },
    legend: {
      orient: "vertical",
      right: 5,
      top: "center",
      textStyle: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 10 },
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

function StatusDefectsChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains("dark");
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
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderColor: isDark ? "#475569" : "#e2e8f0",
      textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" },
    },
    legend: {
      orient: "vertical",
      right: 5,
      top: "center",
      textStyle: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 10 },
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

function ReportDefectsChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains("dark");
  const reportData = jiraStats && jiraStats.byAuthor
    ? Object.entries(jiraStats.byAuthor)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [
        { name: "Development team", value: 55 },
        { name: "Customer", value: 34 },
        { name: "Quality assurance(QA) team", value: 23 },
        { name: "User acceptance testing (UAT) team", value: 8 },
      ];

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderColor: isDark ? "#475569" : "#e2e8f0",
      textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" },
    },
    grid: { left: "35%", right: "10%", top: "5%", bottom: "5%", containLabel: false },
    xAxis: {
      type: "value",
      axisLabel: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 10 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark ? "#334155" : "#e2e8f0" } },
    },
    yAxis: {
      type: "category",
      data: reportData.map((d) => d.name),
      axisLabel: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 9 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: reportData.map((d) => d.value),
        itemStyle: { color: "#10b981" },
        barWidth: "50%",
        label: {
          show: true,
          position: "right",
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: 10,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

function PriorityDefectsChart({ jiraStats }: { jiraStats: DetailedIssueStats | null }) {
  const isDark = document.documentElement.classList.contains("dark");
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
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderColor: isDark ? "#475569" : "#e2e8f0",
      textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" },
    },
    legend: {
      orient: "vertical",
      right: 5,
      top: "center",
      textStyle: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 10 },
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

function AutomationGaugeChart({ value }: { value: number }) {
  const isDark = document.documentElement.classList.contains("dark");
  const automated = value;
  const notAutomated = 100 - value;

  const option = {
    backgroundColor: "transparent",
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
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderColor: isDark ? "#475569" : "#e2e8f0",
      textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" },
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
      axisLine: { lineStyle: { color: isDark ? "#475569" : "#cbd5e1" } },
      axisLabel: {
        color: isDark ? "#94a3b8" : "#64748b",
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
        color: isDark ? "#94a3b8" : "#64748b",
        formatter: "{value}%",
      },
      splitLine: { lineStyle: { color: isDark ? "#334155" : "#e2e8f0" } },
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
                { offset: 0, color: "#8b5cf6" },
                { offset: 1, color: "#7c1a87" },
              ]),
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: "top",
              formatter: "{c}%",
              color: isDark ? "#e2e8f0" : "#1e293b",
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          {
            value: notAutomated,
            itemStyle: {
              color: isDark ? "#334155" : "#e2e8f0",
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: "top",
              formatter: "{c}%",
              color: isDark ? "#94a3b8" : "#64748b",
              fontSize: 14,
              fontWeight: "bold",
            },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

function RunStatusChart({ activeRuns, closedRuns }: { activeRuns: number; closedRuns: number }) {
  const isDark = document.documentElement.classList.contains("dark");
  const total = activeRuns + closedRuns;

  const option = {
    backgroundColor: "transparent",
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
        result += "</div>";
        return result;
      },
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderColor: isDark ? "#475569" : "#e2e8f0",
      textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" },
    },
    legend: {
      data: ["Active", "Closed"],
      bottom: 0,
      left: "center",
      textStyle: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 11 },
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
            { offset: 0, color: "#10b981" },
            { offset: 1, color: "#059669" },
          ]),
          borderRadius: [6, 0, 0, 6],
        },
        label: {
          show: true,
          position: "inside",
          formatter: () => {
            const percent = total > 0 ? Math.round((activeRuns / total) * 100) : 0;
            return activeRuns > 0 ? `${activeRuns} (${percent}%)` : "";
          },
          color: "#ffffff",
          fontSize: 13,
          fontWeight: "bold",
        },
      },
      {
        name: "Closed",
        type: "bar",
        stack: "total",
        data: [closedRuns],
        itemStyle: {
          color: isDark ? "#334155" : "#e2e8f0",
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: "inside",
          formatter: () => {
            const percent = total > 0 ? Math.round((closedRuns / total) * 100) : 0;
            return closedRuns > 0 ? `${closedRuns} (${percent}%)` : "";
          },
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: 13,
          fontWeight: "bold",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "220px" }} />;
}

function ProjectActivityChart({ data }: { data: ProjectActivity[] }) {
  const isDark = document.documentElement.classList.contains("dark");

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderColor: isDark ? "#475569" : "#e2e8f0",
      textStyle: { color: isDark ? "#e2e8f0" : "#1e293b" },
    },
    legend: {
      data: ["Test Cases", "Test Runs", "Test Suites"],
      bottom: 0,
      textStyle: { color: isDark ? "#94a3b8" : "#64748b" },
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
        color: isDark ? "#94a3b8" : "#64748b",
      },
      axisLine: { lineStyle: { color: isDark ? "#475569" : "#cbd5e1" } },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: isDark ? "#475569" : "#cbd5e1" } },
      axisLabel: { color: isDark ? "#94a3b8" : "#64748b" },
      splitLine: { lineStyle: { color: isDark ? "#334155" : "#e2e8f0" } },
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
