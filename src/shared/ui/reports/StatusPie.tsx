// src/ui/reports/StatusPie.tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  STATUS_COLORS,
  STATUS_LABEL,
  STATUS_ORDER,
  type StatusCounts,
  type StatusKey,
  toPieData,
  totals,
} from "./status-colors";

type PieProps = {
  counts: StatusCounts;
  /** Diameter in pixels */
  size?: number;
  /** Ring thickness (for donut) */
  thickness?: number;
  /** Inner border/ring around donut */
  ringWidth?: number;
  /** Donut mode; ON by default */
  donut?: boolean;
  /** Show center */
  showCenter?: boolean;
  /** Center text (e.g., "67%") */
  centerLabel?: React.ReactNode;
  /** Small caption under center text */
  centerSub?: React.ReactNode;
};

export function StatusPie({
  counts,
  size = 160,
  thickness = 22,
  ringWidth = 2,
  donut = true,
  showCenter = false,
  centerLabel,
  centerSub,
}: PieProps) {
  const data = toPieData(counts);
  const total = totals(counts) || 1;

  const outer = size * 0.5;
  const inner = donut ? Math.max(outer - thickness, 0) : 0;

  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        boxShadow: `inset 0 0 0 ${ringWidth}px rgba(148,163,184,.18)`,
      }}
      aria-label="status donut"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            startAngle={90}
            endAngle={-270}
            innerRadius={inner}
            outerRadius={outer}
            stroke="transparent"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {showCenter && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center leading-tight">
            <div className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {centerLabel}
            </div>
            {centerSub && (
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {centerSub}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Legend ---- */
export function StatusLegend({ counts }: { counts: StatusCounts }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
      {STATUS_ORDER.map((k, i) => (
        <span key={k} className="inline-flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: STATUS_COLORS[k] }}
            aria-hidden
          />
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {counts[k] || 0}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{STATUS_LABEL[k]}</span>
          {i < STATUS_ORDER.length - 1 && (
            <span className="mx-1 text-slate-300 dark:text-slate-600">•</span>
          )}
        </span>
      ))}
    </div>
  );
}

/* ---- Donut Card ---- */
export function StatusDonutCard({
  title,
  counts,
  rightSlot,
  donut = true,
  size = 160,
  thickness = 22,
}: {
  title: string;
  counts: StatusCounts;
  rightSlot?: React.ReactNode; // e.g., suite selector
  donut?: boolean;
  size?: number;
  thickness?: number;
}) {
  const total = totals(counts);
  const pct = total ? Math.round(((counts.PASSED || 0) / total) * 100) : 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1524]">
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="flex items-center gap-6">
          <StatusPie
            counts={counts}
            size={size}
            thickness={thickness}
            donut={donut}
            showCenter
            centerLabel={`${pct}%`}
            centerSub="passed"
          />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {title}
            </div>
            <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
              {total} {total === 1 ? "case" : "cases"}
            </div>
            <StatusLegend counts={counts} />
          </div>
        </div>

        <div className="flex items-start justify-end">{rightSlot}</div>
      </div>
    </section>
  );
}

export type { StatusCounts, StatusKey };
