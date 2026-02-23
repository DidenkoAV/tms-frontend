import * as React from "react";

export function Donut({
  parts,
  size = 240,
  stroke = 22,
  center,
  responsive = true,
  minPctToLabel = 7,
}: {
  parts: Array<{ value: number; color: string; label?: string }>;
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
  responsive?: boolean;
  minPctToLabel?: number;
}) {
  const total = Math.max(1, parts.reduce((a, b) => a + b.value, 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let acc = 0;
  const enriched = parts.map((p) => {
    const pct = p.value / total;
    const sweep = pct * 2 * Math.PI;
    const mid = acc + sweep / 2;
    acc += sweep;
    return { ...p, pct, mid };
  });

  const containerStyle = responsive
    ? { width: `clamp(160px, 42vw, ${size}px)`, aspectRatio: "1 / 1" as any }
    : { width: `${size}px`, height: `${size}px` };

  return (
    <div className="relative grid min-w-0 place-items-center" style={containerStyle}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth={stroke} />
        {parts.map((p, i) => {
          if (p.value <= 0) return null;
          const len = c * (p.value / total);
          const dash = `${len} ${c - len}`;
          const rot = (acc / total) * 360;
          acc += p.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeLinecap="round"
              transform={`rotate(${rot - 90} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      {center && <div className="absolute text-center select-none">{center}</div>}
    </div>
  );
}

export function HBar({ value, total, color, className = "" }: { value: number; total: number; color: string; className?: string }) {
  const pct = total ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <div className={`h-2.5 w-full rounded-full bg-slate-200/60 dark:bg-white/10 ${className}`}>
      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color, transition: "width 600ms" }} />
    </div>
  );
}
