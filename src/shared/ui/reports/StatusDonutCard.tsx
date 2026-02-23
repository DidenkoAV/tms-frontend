import { ReactNode, useMemo, useEffect, useState, CSSProperties } from "react";
import {
  STATUS_COLORS,
  STATUS_LABEL,
  STATUS_ORDER,
  TRACK,
  type StatusKey,
} from "./status-colors";

/* helpers */
function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

type Counts = Partial<Record<StatusKey, number>>;
type Variant = "donut" | "pie";

const DIAM = 144;

export function StatusDonutCard({
  title,
  counts,
  rightSlot,
  variant = "donut",
  thickness = 18,
}: {
  title: string;
  counts: Counts;
  rightSlot?: ReactNode;
  variant?: Variant;
  thickness?: number;
}) {
  const [dark, setDark] = useState<boolean>(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // 🎨 Auto theme update
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { safeCounts, total, passPct } = useMemo(() => {
    const safe: Record<StatusKey, number> = {
      PASSED: 0,
      RETEST: 0,
      FAILED: 0,
      SKIPPED: 0,
      BROKEN: 0,
    };
    for (const k of STATUS_ORDER) safe[k] = Math.max(0, counts?.[k] ?? 0);
    const t = STATUS_ORDER.reduce((s, k) => s + safe[k], 0);
    const pct = t > 0 ? Math.round((safe.PASSED / t) * 100) : 0;
    return { safeCounts: safe, total: t, passPct: pct };
  }, [counts]);

  const ringBg = useMemo(() => {
    if (!total) return TRACK[dark ? "dark" : "light"];
    const stops: string[] = [];
    let acc = 0;
    for (const k of STATUS_ORDER) {
      const v = safeCounts[k];
      if (!v) continue;
      const from = acc * 360;
      acc += v / total;
      const to = acc * 360;
      stops.push(
        `${STATUS_COLORS[k][dark ? "dark" : "light"]} ${from}deg ${to}deg`
      );
    }
    if (acc < 1)
      stops.push(`${TRACK[dark ? "dark" : "light"]} ${acc * 360}deg 360deg`);
    return `conic-gradient(${stops.join(",")})`;
  }, [safeCounts, total, dark]);

  const tone =
    passPct < 30
      ? STATUS_COLORS.FAILED[dark ? "dark" : "light"]
      : passPct < 70
      ? STATUS_COLORS.RETEST[dark ? "dark" : "light"]
      : STATUS_COLORS.PASSED[dark ? "dark" : "light"];

  const shouldPulse = passPct < 70 && total > 0;
  const pctFontSize = Math.max(Math.round(DIAM * 0.16), 22);

  return (
    <section
      className={`rounded-3xl border ${
        dark
          ? "border-slate-800 bg-[#0f1524] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
          : "border-slate-200 bg-white shadow-sm"
      } p-5 transition-colors duration-300`}
    >
      <style>{`
        @keyframes donutSoftPulse {
          0%   { box-shadow: 0 0 0 0 var(--pulse-color); transform: scale(1); }
          60%  { box-shadow: 0 0 0 12px rgba(0,0,0,0);  transform: scale(1.035); }
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0);     transform: scale(1); }
        }
      `}</style>

      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold tracking-wider text-slate-600 dark:text-slate-300">
          {title}
        </div>
        {rightSlot}
      </div>

      <div className="flex items-center gap-6 md:gap-8">
        {/* DONUT */}
        <div className="relative rounded-full h-36 w-36 shrink-0" aria-hidden>
          <div
            className="absolute inset-0 transition-all rounded-full ring-1 ring-slate-200/60 dark:ring-slate-700/80"
            style={{ background: ringBg }}
          />
          {variant === "donut" && (
            <div
              className="absolute transition-all rounded-full"
              style={{
                inset: thickness,
                background: dark ? "#0f1524" : "#fff",
                boxShadow: dark
                  ? `inset 0 1px 0 ${alpha("#ffffff", 0.08)}`
                  : `inset 0 1px 0 ${alpha("#000000", 0.04)}`,
              }}
            />
          )}

          <div className="absolute inset-0 grid pointer-events-none place-items-center">
            <div className="relative flex flex-col items-center -translate-y-[1px]">
              {shouldPulse && (
                <span
                  className="absolute rounded-full -inset-2"
                  style={
                    {
                      animation: "donutSoftPulse 2s ease-in-out infinite",
                      "--pulse-color": alpha(tone, dark ? 0.3 : 0.25),
                    } as CSSProperties
                  }
                />
              )}

              <div
                className="relative leading-none transition-all select-none tabular-nums"
                style={{
                  fontSize: pctFontSize,
                  fontWeight: 700,
                  color: dark ? "#fff" : "#0f172a",
                  textShadow: dark
                    ? "0 1px 2px rgba(0,0,0,.45)"
                    : "0 1px 2px rgba(0,0,0,.05)",
                }}
              >
                {passPct}%
              </div>

              <span
                className={`mt-1 rounded-full px-3 py-[3px] text-[12px] font-medium capitalize border transition-all ${
                  dark
                    ? "text-slate-300 border-slate-700 bg-[#10192d]"
                    : "text-slate-700 border-slate-200 bg-white"
                }`}
                style={{
                  borderColor: alpha(tone, dark ? 0.5 : 0.4),
                  boxShadow: dark
                    ? `0 0 8px ${alpha(tone, 0.15)}`
                    : `0 0 6px ${alpha(tone, 0.1)}`,
                }}
              >
                passed
              </span>
            </div>
          </div>
        </div>

        {/* LEGEND */}
        <div className="min-w-[240px]">
          <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            {total} cases
          </div>
          <ul className="space-y-2">
            {STATUS_ORDER.map((k) => (
              <LegendRow
                key={k}
                color={STATUS_COLORS[k][dark ? "dark" : "light"]}
                label={STATUS_LABEL[k]}
                value={safeCounts[k] || 0}
                dark={dark}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Legend Row ---------- */
function LegendRow({
  color,
  label,
  value,
  dark,
}: {
  color: string;
  label: string;
  value: number;
  dark: boolean;
}) {
  return (
    <li
      className={`group flex items-center justify-between rounded-xl px-2 py-1.5 transition-all ${
        dark ? "hover:bg-white/5" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className="relative inline-block h-2.5 w-2.5 rounded-full transition-transform duration-200 group-hover:scale-110"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 0 3px ${alpha(color, 0.15)}`,
          }}
        />
        <span
          className={`text-[15px] transition-colors ${
            dark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          {label}
        </span>
      </div>
      <span
        className={`ml-3 rounded-full border px-2 py-0.5 text-[12px] font-semibold tabular-nums ${
          dark ? "text-slate-200" : "text-slate-700"
        }`}
        style={{
          borderColor: alpha(color, 0.35),
          background: dark
            ? alpha(color, 0.15)
            : `linear-gradient(180deg, ${alpha(color, 0.1)}, ${alpha(
                color,
                0.05
              )})`,
        }}
      >
        {value}
      </span>
    </li>
  );
}
