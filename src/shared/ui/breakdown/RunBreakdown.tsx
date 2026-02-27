import { useEffect, useState } from "react";

export type StatusKey = "PASSED" | "FAILED" | "RETEST" | "SKIPPED" | "BROKEN";

type Counts = Record<StatusKey, number>;

const EMPTY_COUNTS: Counts = {
  PASSED: 0,
  FAILED: 0,
  RETEST: 0,
  SKIPPED: 0,
  BROKEN: 0,
};

const STATUS_ORDER: StatusKey[] = [
  "PASSED",
  "FAILED",
  "RETEST",
  "SKIPPED",
  "BROKEN",
];

const STATUS_CLASSES: Record<StatusKey, string> = {
  PASSED: "bg-emerald-600 dark:bg-emerald-500",
  FAILED: "bg-red-600 dark:bg-red-500",
  RETEST: "bg-amber-600 dark:bg-amber-500",
  SKIPPED: "bg-slate-500 dark:bg-slate-400",
  BROKEN: "bg-purple-600 dark:bg-purple-500",
};

const STATUS_DOTS: Record<StatusKey, string> = {
  PASSED: "bg-emerald-600 dark:bg-emerald-500",
  FAILED: "bg-red-600 dark:bg-red-500",
  RETEST: "bg-amber-600 dark:bg-amber-500",
  SKIPPED: "bg-slate-500 dark:bg-slate-400",
  BROKEN: "bg-purple-600 dark:bg-purple-500",
};

type Props = {
  counts?: Partial<Counts>;
  total?: number;
  loading?: boolean;
};

export function RunBreakdown({
  counts = EMPTY_COUNTS,
  total = 0,
  loading = false,
}: Props) {
  const safeCounts: Counts = { ...EMPTY_COUNTS, ...counts };
  const sumCounts = STATUS_ORDER.reduce(
    (acc, key) => acc + (safeCounts[key] ?? 0),
    0
  );
  const denom = Math.max(1, total || sumCounts);
  const passed = safeCounts.PASSED ?? 0;
  const pctPassed = Math.round((passed / denom) * 100);

  const [ready, setReady] = useState(!loading);
  useEffect(() => {
    if (loading) {
      setReady(false);
      return;
    }
    const timeout = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(timeout);
  }, [loading, counts, total]);

  const segments = STATUS_ORDER.map((key) => ({
    key,
    value: Math.max(0, safeCounts[key] ?? 0),
  })).filter((seg) => seg.value > 0);

  if (loading && !ready) {
    return (
      <div className="flex items-center w-full gap-3">
        <div className="relative flex-1 h-6 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 animate-pulse bg-slate-200/80 dark:bg-slate-700/60" />
        </div>
        <span className="text-sm font-medium tracking-tight text-slate-400 dark:text-slate-500 min-w-[60px] text-right">
          Loading…
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Progress bar */}
      <div className="relative flex h-6 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        {segments.length === 0 ? (
          <div className="absolute inset-0 grid text-xs font-medium text-slate-500 dark:text-slate-400 place-items-center">
            No data
          </div>
        ) : (
          <>
            {segments.map(({ key, value }) => {
              const width = ready ? (value / denom) * 100 : 0;
              return (
                <div
                  key={key}
                  className={`h-full transition-[width] duration-500 ease-out ${STATUS_CLASSES[key]}`}
                  style={{
                    width: `${width}%`,
                    minWidth: ready && value > 0 ? 6 : 0,
                  }}
                  title={`${key}: ${value} (${Math.round((value / denom) * 100)}%)`}
                  aria-label={`${key.toLowerCase()} ${value}`}
                />
              );
            })}
            {/* Pass rate overlay */}
            <div className="absolute inset-0 flex items-center justify-end px-2 pointer-events-none">
              <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tabular-nums">
                {pctPassed}% PASS
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[11px] font-medium">
        {segments.map(({ key, value }) => {
          const pct = Math.round((value / denom) * 100);
          return (
            <span
              key={key}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
            >
              <span className={`h-2 w-2 rounded-sm ${STATUS_DOTS[key]} shadow-sm`} />
              <span className="capitalize">{key.toLowerCase()}</span>
              <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                {value} ({pct}%)
              </span>
            </span>
          );
        })}
        {segments.length === 0 && (
          <span className="text-slate-400 dark:text-slate-500">
            No test results yet
          </span>
        )}
      </div>
    </div>
  );
}

export default RunBreakdown;
