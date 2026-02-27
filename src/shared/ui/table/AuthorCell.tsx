import * as React from "react";

export default function AuthorCell({
  name,
  email,
  userId,
}: {
  name?: string | null;
  email?: string | null;
  userId?: number | null;
}) {
  // Compact display: only name (no email, no avatar)
  const display =
    (name && name.trim()) ||
    (email && email.split('@')[0]?.trim()) ||
    (userId ? `User #${userId}` : "—");

  // Generate a consistent color based on the display name
  const getColorFromName = (str: string) => {
    if (str === "—") return "slate";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ["blue", "purple", "pink", "indigo", "teal", "cyan", "emerald", "amber"];
    return colors[Math.abs(hash) % colors.length];
  };

  const color = getColorFromName(display);

  const colorClasses = {
    slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    purple: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300",
    pink: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-300",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300",
    teal: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium truncate max-w-full ${colorClasses[color as keyof typeof colorClasses]}`}
      title={name || email || undefined}
    >
      {display}
    </div>
  );
}
