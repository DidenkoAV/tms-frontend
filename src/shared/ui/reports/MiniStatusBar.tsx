import { STATUS_COLORS, STATUS_ORDER, TRACK, isDarkTheme, type StatusKey } from "./status-colors";

export function MiniStatusBar({
  counts,
  total,
}: {
  counts: Partial<Record<StatusKey, number>>;
  total: number;
}) {
  const dark = isDarkTheme();

  if (!total) {
    return (
      <div
        className="ml-1 h-1.5 w-28 rounded-full border"
        style={{
          borderColor: dark ? "rgba(51,65,85,.6)" : "rgba(203,213,225,.8)",
          background: TRACK[dark ? "dark" : "light"],
        }}
      />
    );
  }

  return (
    <div
      className="relative ml-1 flex h-1.5 w-28 overflow-hidden rounded-full border"
      style={{ borderColor: dark ? "rgba(51,65,85,.6)" : "rgba(203,213,225,.8)" }}
    >
      {STATUS_ORDER.map((k) => {
        const v = Math.max(0, counts?.[k] ?? 0);
        if (!v) return null;
        const w = (v / total) * 100;
        const color = STATUS_COLORS[k][dark ? "dark" : "light"];
        return <div key={k} className="h-full" style={{ width: `${w}%`, backgroundColor: color }} />;
      })}
    </div>
  );
}
