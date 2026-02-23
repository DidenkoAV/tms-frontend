// src/ui/runs/StatusBreakdownBar.tsx
import { useEffect, useMemo, useState } from "react";

export type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";

export const STATUS_ORDER: StatusKey[] = [
  "PASSED",
  "FAILED",
  "RETEST",
  "SKIPPED",
  "BROKEN",
];

const STATUS_COLORS_LIGHT: Record<StatusKey, string> = {
  PASSED: "#22C55E",
  FAILED: "#EF4444",
  RETEST: "#F59E0B",
  SKIPPED: "#3B82F6",
  BROKEN: "#8B5CF6",
};

const STATUS_COLORS_DARK: Record<StatusKey, string> = {
  PASSED: "#16A34A",
  FAILED: "#DC2626",
  RETEST: "#EAB308",
  SKIPPED: "#2563EB",
  BROKEN: "#7C3AED",
};

export const STATUS_COLORS = {
  light: STATUS_COLORS_LIGHT,
  dark: STATUS_COLORS_DARK,
};

function useIsDarkTheme(initial = false) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return initial;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    const update = () => setIsDark(root.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMedia = () => update();
    media.addEventListener("change", handleMedia);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", handleMedia);
    };
  }, []);

  return isDark;
}

const TEXT_BY_SIZE: Record<"xs" | "sm" | "md", string> = {
  xs: "text-[11px]",
  sm: "text-[12px]",
  md: "text-[13px]",
};

export function StatusBreakdownBar({
  total,
  counts,
  size = "sm",
  className = "",
  showPercent = true,
}: {
  total: number;
  counts: Record<StatusKey, number>;
  size?: "xs" | "sm" | "md";
  className?: string;
  showPercent?: boolean;
}) {
  const isDark = useIsDarkTheme();
  const colors = isDark ? STATUS_COLORS.dark : STATUS_COLORS.light;

  const segments = useMemo(() => {
    return STATUS_ORDER.map((key) => ({
      key,
      value: Math.max(0, counts[key] ?? 0),
    })).filter((s) => s.value > 0);
  }, [counts]);

  const sumCounts = segments.reduce((acc, s) => acc + s.value, 0);
  const denom = total || sumCounts || 1;
  const passed = counts.PASSED ?? 0;
  const percentPassed = Math.round((passed / denom) * 100);

  const textClass = TEXT_BY_SIZE[size] ?? TEXT_BY_SIZE.sm;

  return (
    <div
      className={`flex items-center justify-between gap-3 h-[36px] ${className}`}
    >
      {/* Bar */}
      <div
        className={`relative flex w-full h-[12px] overflow-hidden rounded-full border border-slate-200/80 bg-slate-100/70 
        dark:border-slate-700/70 dark:bg-slate-800/40 transition-colors`}
      >
        {segments.length === 0 ? (
          <div className="grid h-full w-full place-items-center text-[10px] text-slate-400 dark:text-slate-500">
            No data
          </div>
        ) : (
          segments.map(({ key, value }) => (
            <div
              key={key}
              className="h-full transition-[flex] duration-500 hover:opacity-90"
              style={{
                flex: value,
                minWidth: value > 0 ? "4px" : 0,
                backgroundColor: colors[key],
              }}
              aria-label={`${key.toLowerCase()} ${value}`}
            />
          ))
        )}
      </div>

      {showPercent && (
        <span
          className={`min-w-[42px] text-right font-medium text-slate-700 dark:text-slate-200 ${textClass}`}
        >
          {percentPassed}%
        </span>
      )}
    </div>
  );
}

export default StatusBreakdownBar;
