// src/ui/table/SortHeader.tsx
import * as React from "react";
import { StarIcon } from "@/shared/ui/icons";

export type SortDir = "asc" | "desc";

/** Favorite star */
export function FavSortHeader({
  active,
  dir,
  onToggle,
  className = "",
  ...rest
}: {
  active: boolean;
  dir: SortDir;
  onToggle: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title="Sort by favorites"
      className={[
        "inline-flex h-[26px] w-[26px] items-center justify-center rounded-md transition-all",
        "border border-slate-200/60 bg-white/70 text-slate-400 hover:text-amber-500 hover:border-slate-300",
        "dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500 dark:hover:text-amber-400",
        active &&
          "text-amber-500 border-amber-300/60 shadow-[0_2px_8px_rgba(251,191,36,0.25)] dark:border-amber-400/50",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-300/70 dark:focus-visible:ring-slate-600/50",
        className,
      ].join(" ")}
      {...rest}
    >
      <StarIcon size={14} filled={active} />
      <span className="sr-only">Sort by favorites</span>
    </button>
  );
}

/** Compact sorting header pill */
export function SortPill({
  label,
  active,
  dir,
  onClick,
  onToggle,
  className = "",
  ...rest
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick?: () => void;
  onToggle?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const handle = onClick ?? onToggle ?? (() => {});

  const arrow = (
    <svg
      viewBox="0 0 20 20"
      width="9"
      height="9"
      className={`transition-transform ${dir === "asc" ? "rotate-180" : ""} ${
        active ? "opacity-80" : "opacity-40"
      }`}
      aria-hidden
    >
      <path d="M6 8l4 4 4-4" fill="currentColor" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={handle}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={[
        "inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all",
        "border border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-50",
        "bg-transparent dark:bg-transparent",
        active &&
          "text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/60 shadow-[0_4px_12px_rgba(15,23,42,0.1)] dark:shadow-[0_4px_14px_rgba(2,6,23,0.7)]",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-300/60 dark:focus-visible:ring-slate-600/50",
        className,
      ].join(" ")}
      {...rest}
    >
      <span>{label}</span>
      {arrow}
    </button>
  );
}

/* Aliases */
export const SortHeader = SortPill;
export default SortPill;
