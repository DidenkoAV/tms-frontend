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
  PASSED: "bg-[#00C47A] dark:bg-[#24E0A7]",
  FAILED: "bg-[#FF6B81] dark:bg-[#FF7D95]",
  RETEST: "bg-[#FFD66C] dark:bg-[#FFE19C]",
  SKIPPED: "bg-[#6ACBFF] dark:bg-[#8CD5FF]",
  BROKEN: "bg-[#B191FF] dark:bg-[#CDA8FF]",
};

const STATUS_DOTS: Record<StatusKey, string> = {
  PASSED: "bg-[#00C47A] dark:bg-[#24E0A7]/80",
  FAILED: "bg-[#FF6B81] dark:bg-[#FF7D95]/80",
  RETEST: "bg-[#FFD66C] dark:bg-[#FFE19C]/80",
  SKIPPED: "bg-[#6ACBFF] dark:bg-[#8CD5FF]/80",
  BROKEN: "bg-[#B191FF] dark:bg-[#CDA8FF]/80",
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
      <div className="flex items-center w-full gap-2">
        <div className="relative flex-1 h-3.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-0 animate-pulse bg-slate-200/80 dark:bg-slate-700/60" />
        </div>
        <span className="text-xs font-medium tracking-tight text-slate-400 dark:text-slate-500">
          …
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="relative flex h-3.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/15">
        {segments.length === 0 ? (
          <div className="absolute inset-0 grid text-[10px] text-slate-500 dark:text-slate-400 place-items-center">
            No data
          </div>
        ) : (
          segments.map(({ key, value }) => {
            const width = ready ? (value / denom) * 100 : 0;
            return (
              <div
                key={key}
                className={`h-full transition-[width] duration-500 ease-out ${STATUS_CLASSES[key]}`}
                style={{
                  width: `${width}%`,
                  minWidth: ready && value > 0 ? 4 : 0,
                }}
                aria-label={`${key.toLowerCase()} ${value}`}
              />
            );
          })
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-white/80">
        <div className="flex gap-2 text-slate-500 dark:text-white/80">
          {segments.slice(0, 3).map(({ key, value }) => (
            <span
              key={key}
              className="flex items-center gap-1 text-slate-500 dark:text-white/80"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[key]}`} />
              {Math.round((value / denom) * 100)}%
            </span>
          ))}
        </div>
        <span className="text-slate-500 dark:text-white">
          PASS&nbsp;
          <span className="text-slate-800 dark:text-white tabular-nums">
            {pctPassed}%
          </span>
        </span>
      </div>
    </div>
  );
}

export default RunBreakdown;
