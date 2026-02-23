import { useMemo } from "react";

export type StatusKey = "PASSED" | "FAILED" | "RETEST" | "SKIPPED" | "BROKEN";
export type StatusCounts = Record<StatusKey, number>;

const COLORS: Record<StatusKey, string> = {
  PASSED: "#10b981",   // green
  FAILED: "#ef4444",   // red
  RETEST: "#f59e0b",   // amber
  SKIPPED: "#0ea5e9",  // sky
  BROKEN: "#64748b",   // slate
};

const ORDER: StatusKey[] = ["PASSED", "FAILED", "RETEST", "SKIPPED", "BROKEN"];

function conicFromCounts(counts: StatusCounts, total: number) {
  let acc = 0;
  const parts: string[] = [];
  ORDER.forEach((k) => {
    const slice = total ? (counts[k] / total) * 360 : 0;
    if (slice > 0.0001) {
      const from = acc;
      const to = acc + slice;
      parts.push(`${COLORS[k]} ${from}deg ${to}deg`);
      acc = to;
    }
  });

  // If all zeros, show gray circle
  if (parts.length === 0) {
    return "conic-gradient(#e5e7eb 0deg 360deg)";
  }
  
  return `conic-gradient(${parts.join(",")})`;
}

interface Props {
  counts: StatusCounts;
  total: number;
  className?: string;
}

export default function BeautifulMilestoneDashboard({ counts, total, className = "" }: Props) {
  const safeTotal = Math.max(0, total);
  const passRate = safeTotal ? Math.round((counts.PASSED / safeTotal) * 100) : 0;

  const rows = useMemo(
    () =>
      ORDER.map((k) => {
        const value = counts[k] || 0;
        const pct = safeTotal ? Math.round((value / safeTotal) * 100) : 0;
        const label =
          k === "PASSED" ? "Passed" :
          k === "FAILED" ? "Failed" :
          k === "RETEST" ? "Retest" :
          k === "SKIPPED" ? "Skipped" :
          "Broken";
        return { key: k, label, value, pct, color: COLORS[k] };
      }),
    [counts, safeTotal]
  );

  const hasFailures = counts.FAILED > 0 || counts.BROKEN > 0;

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 backdrop-blur-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Test Results
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hasFailures ? "Issues detected" : "All tests passed"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {safeTotal}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Tests
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Beautiful Donut Chart */}
        <div className="relative flex-shrink-0">
          {/* Outer glow effect */}
          <div 
            className="absolute inset-0 transition-all duration-300 rounded-full blur-md opacity-30"
            style={{ 
              background: conicFromCounts(counts, safeTotal),
              transform: 'scale(1.1)'
            }} 
          />
          
          {/* Main donut */}
          <div
            className="relative w-24 h-24 transition-transform duration-300 rounded-full shadow-lg ring-4 ring-white/50 dark:ring-slate-800/50 hover:scale-105"
            style={{ background: conicFromCounts(counts, safeTotal) }}
          >
            <div className="grid w-full h-full bg-white rounded-full shadow-inner place-items-center dark:bg-slate-900">
              <div className="text-center">
                <div className={`text-lg font-black tabular-nums ${
                  passRate === 100 ? "text-green-600 dark:text-green-400" :
                  passRate >= 80 ? "text-amber-600 dark:text-amber-400" :
                  "text-red-600 dark:text-red-400"
                }`}>
                  {passRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent animate-ping [animation-duration:3s] opacity-10"
               style={{ background: conicFromCounts(counts, safeTotal) }} />
        </div>

        {/* Status Bars */}
        <div className="flex-1 space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 transition-all duration-300 rounded-full group-hover:scale-125 group-hover:shadow-sm"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[60px]">
                    {r.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {r.pct}%
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums min-w-[20px] text-right">
                    {r.value}
                  </span>
                </div>
              </div>
              
              {/* Animated progress bar */}
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div 
                  className="h-full transition-all duration-1000 ease-out rounded-full"
                  style={{ 
                    width: `${r.pct}%`, 
                    backgroundColor: r.color,
                    opacity: r.value > 0 ? 1 : 0.3
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Badge */}
      {passRate === 100 && (
        <div className="flex justify-center mt-4">
        
        </div>
      )}
    </section>
  );
}