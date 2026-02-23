// src/shared/ui/columns/ColumnsMenu.tsx
import { useEffect, useRef, useState } from "react";
import { TFCheckbox } from "@/shared/ui/table";

type Key = string;

export type ColumnsMenuItem<K extends Key = Key> = {
  key: K;
  label: string;
};

type ColumnsMenuProps<K extends Key> = {
  items: ColumnsMenuItem<K>[];
  value: Record<K, boolean>;
  onChange: (next: Record<K, boolean>) => void;
  buttonLabel?: string;
  className?: string;
  iconSize?: number;
  fontSize?: string;
  padding?: string;
  radius?: string;
  height?: string;
};

export default function ColumnsMenu<K extends Key>({
  items,
  value,
  onChange,
  buttonLabel = "Columns",
  className = "",
  iconSize = 12,
  fontSize,
  padding,
  radius,
  height,
}: ColumnsMenuProps<K>) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const resolvedFont = fontSize ?? "text-[12px] font-medium";
  const resolvedPadding = padding ?? "px-3";
  const resolvedRadius = radius ?? "rounded-2xl";
  const resolvedHeight = height ?? "h-8";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (boxRef.current && boxRef.current.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Unified button style
  const modernButton = [
    "inline-flex items-center gap-1.5 select-none border transition-all duration-200 ease-out",
    "border-slate-200 bg-white/95 text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
    "hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2",
    "active:translate-y-0",
    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
    "dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-900",
    resolvedHeight,
    resolvedRadius,
    resolvedPadding,
    resolvedFont,
  ].join(" ");

  return (
    <div className={"relative " + className} ref={boxRef}>
      {/* --- Trigger button --- */}
      <button
        type="button"
        className={modernButton}
        title="Show / hide columns"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <IconColumns
          className="text-slate-500 dark:text-slate-400"
          size={iconSize}
        />
        {buttonLabel}
      </button>

      {/* --- Dropdown panel --- */}
      <div
        className={[
          "absolute right-0 z-20 mt-2 w-56 rounded-lg border shadow-lg backdrop-blur-sm",
          "border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-800/95",
          "transition-all duration-150 ease-out origin-top-right",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
        role="menu"
      >
        <div className="px-3 pt-2 pb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Show columns
        </div>
        <div className="grid gap-1 px-2.5 pb-2 text-slate-800 dark:text-slate-200">
          {items.map(({ key, label }) => (
            <label
              key={String(key)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              role="menuitemcheckbox"
              aria-checked={!!value[key]}
            >
              <span className="text-[13px]">{label}</span>
              <TFCheckbox
                stop
                checked={!!value[key]}
                onChange={(v: boolean) => onChange({ ...value, [key]: v })}
                title={value[key] ? "Hide" : "Show"}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Updated icon: clean, balanced, premium look --- */
function IconColumns({
  size = 12,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M9 4v16M15 4v16"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
