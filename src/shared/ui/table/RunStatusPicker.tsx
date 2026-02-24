import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STATUS_ID } from "@/entities/test-result";

/** Status keys */
export type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";

export type StatusPickerOption = {
  id: number;
  label: string;
  badge: string;
  dot: string;
};

const ORDER: StatusKey[] = ["PASSED", "RETEST", "FAILED", "SKIPPED", "BROKEN"];

const LABEL: Record<StatusKey, string> = {
  PASSED: "Passed",
  RETEST: "Retest",
  FAILED: "Failed",
  SKIPPED: "Skipped",
  BROKEN: "Broken",
};

const BADGE: Record<StatusKey, string> = {
  PASSED:
    "text-emerald-800 bg-emerald-100/80 border border-emerald-400/60 hover:border-emerald-500 focus:ring-emerald-400 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700/80 hover:dark:border-emerald-600",
  RETEST:
    "text-amber-800 bg-amber-100/80 border border-amber-400/60 hover:border-amber-500 focus:ring-amber-400 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-700/80 hover:dark:border-amber-600",
  FAILED:
    "text-red-800 bg-red-100/80 border border-red-400/60 hover:border-red-500 focus:ring-red-400 dark:text-red-300 dark:bg-red-950/60 dark:border-red-700/80 hover:dark:border-red-600",
  SKIPPED:
    "text-slate-700 bg-slate-100/80 border border-slate-400/60 hover:border-slate-500 focus:ring-slate-400 dark:text-slate-300 dark:bg-slate-800/60 dark:border-slate-600/80 hover:dark:border-slate-500",
  BROKEN:
    "text-purple-800 bg-purple-100/80 border border-purple-400/60 hover:border-purple-500 focus:ring-purple-400 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-700/80 hover:dark:border-purple-600",
};

const DOT: Record<StatusKey, string> = {
  PASSED: "bg-emerald-600 dark:bg-emerald-500",
  RETEST: "bg-amber-600 dark:bg-amber-500",
  FAILED: "bg-red-600 dark:bg-red-500",
  SKIPPED: "bg-slate-500 dark:bg-slate-400",
  BROKEN: "bg-purple-600 dark:bg-purple-500",
};

const DEFAULT_OPTIONS: StatusPickerOption[] = ORDER.map((key) => ({
  id: STATUS_ID[key],
  label: LABEL[key],
  badge: BADGE[key],
  dot: DOT[key],
}));

// ? fixed width, matches CaseBadge
const PICKER_WIDTH = 90;

const findOption = (
  options: StatusPickerOption[],
  id: number | null
): StatusPickerOption => {
  return options.find((opt) => opt.id === id) ?? options[0];
};

/* ---------- Badge ---------- */
export function RunStatusBadge({
  id,
  className = "",
  options,
}: {
  id: number | null;
  className?: string;
}) {
  const opts = options ?? DEFAULT_OPTIONS;
  const current = findOption(opts, id);
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${current.badge} ${className}`}
      style={{ minWidth: PICKER_WIDTH, maxWidth: PICKER_WIDTH }}
    >
      <span className={`h-2 w-2 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

/* ---------- Picker ---------- */
export default function RunStatusPicker({
  valueId,
  onChange,
  options,
  width,
}: {
  valueId: number | null;
  onChange: (id: number) => void;
  options?: StatusPickerOption[];
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const opts = options ?? DEFAULT_OPTIONS;
  const current = findOption(opts, valueId);
  const pickerWidth = width ?? PICKER_WIDTH;

  // close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current && (t === btnRef.current || btnRef.current.contains(t))) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  // positioning
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const gap = 4;
    const top = r.bottom + gap;
    const left = Math.min(r.left, Math.max(8, window.innerWidth - pickerWidth - 8));
    setPos({ left, top });
  }, [open, pickerWidth]);

  return (
    <div className="relative inline-block">
      {/* Current status */}
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${current.badge}`}
        style={{ minWidth: pickerWidth, maxWidth: pickerWidth }}
        type="button"
        title="Change status"
      >
        <span className={`h-2 w-2 rounded-full ${current.dot}`} />
        {current.label}
        <svg
          className="ml-1 opacity-70"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown via portal */}
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              zIndex: 1100,
              width: pickerWidth + 20,
            }}
            className="bg-white border rounded-md shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900"
          >
            {opts.map((opt, i) => (
              <button
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex items-center justify-start gap-2 w-full px-2.5 py-[5px] text-[11px] text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  i !== opts.length - 1
                    ? "border-b border-slate-100/80 dark:border-slate-800/80"
                    : ""
                }`}
                type="button"
              >
                <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
