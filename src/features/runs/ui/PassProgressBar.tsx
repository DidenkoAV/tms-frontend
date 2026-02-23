import React from "react";

export type PassBarSize = "xs" | "sm" | "md";


export function PassProgressBar({
  total,
  passed,
  size = "md",
  loading = false,
  className = "",
}: {
  total: number;
  passed: number;
  size?: PassBarSize;
  loading?: boolean;
  className?: string;
}) {
  const rate = total > 0 ? passed / total : 0;
  const pct = Math.round(rate * 100);

  const h =
    size === "xs" ? "h-[11px]" :
    size === "sm" ? "h-4" :     // ~16px
    "h-5";                      // ~20px

  const ring =
    total > 0
      ? rate >= 0.8
        ? "ring-emerald-500/25"
        : rate >= 0.5
          ? "ring-amber-400/20"
          : "ring-slate-500/25"
      : "";

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-full border shadow-inner",
        h,
        "border-slate-200 bg-slate-100",
        "dark:border-slate-700 dark:bg-slate-900",
        total > 0 ? `ring-2 ${ring}` : "ring-0",
        className,
      ].join(" ")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label="Passed percentage"
    >
      {loading ? (
        <div className="absolute inset-0 animate-pulse bg-slate-300/30 dark:bg-slate-600/30" />
      ) : total === 0 ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[12px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
            No cases
          </span>
        </div>
      ) : (
        <div
          className="absolute left-0 top-0 h-full bg-emerald-500 dark:bg-emerald-400"
          style={{ width: `${pct}%`, transition: "width 420ms ease-out" }}
        />
      )}
      {/* light gloss/outline */}
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/5 dark:ring-white/10" />
    </div>
  );
}

export default PassProgressBar;
