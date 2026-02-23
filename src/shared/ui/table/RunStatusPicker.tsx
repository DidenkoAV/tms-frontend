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
    "text-emerald-700 bg-emerald-50 border border-emerald-300 hover:border-emerald-400 focus:ring-emerald-300 dark:text-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-700 hover:dark:border-emerald-500",
  RETEST:
    "text-amber-700 bg-amber-50 border border-amber-300 hover:border-amber-400 focus:ring-amber-300 dark:text-amber-200 dark:bg-amber-900/40 dark:border-amber-700",
  FAILED:
    "text-rose-700 bg-rose-50 border border-rose-300 hover:border-rose-400 focus:ring-rose-300 dark:text-rose-200 dark:bg-rose-900/40 dark:border-rose-700",
  SKIPPED:
    "text-sky-700 bg-sky-50 border border-sky-300 hover:border-sky-400 focus:ring-sky-300 dark:text-sky-200 dark:bg-sky-900/40 dark:border-sky-700",
  BROKEN:
    "text-slate-700 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:ring-slate-300 dark:text-slate-200 dark:bg-slate-800/60 dark:border-slate-700",
};

const DOT: Record<StatusKey, string> = {
  PASSED: "bg-emerald-500 dark:bg-emerald-400",
  RETEST: "bg-amber-400 dark:bg-amber-300",
  FAILED: "bg-rose-500 dark:bg-rose-400",
  SKIPPED: "bg-sky-500 dark:bg-sky-400",
  BROKEN: "bg-slate-500 dark:bg-slate-300",
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
