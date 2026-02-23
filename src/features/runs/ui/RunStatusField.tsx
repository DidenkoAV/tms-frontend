import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/shared/ui/icons";
import { addResult } from "@/entities/test-result";
import { FIND_META, RESULT_CHOICES } from "@/entities/test-result";

export function RunStatusField({
  runId, caseId, valueId, loading, onChanged, notify,
}: {
  runId: number;
  caseId: number;
  valueId: number | null;
  loading: boolean;
  onChanged: (nextId: number) => void;
  notify?: (kind: "info" | "error" | "success" | "warning", text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const meta = FIND_META(valueId);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current && (t === btnRef.current || btnRef.current.contains(t))) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("click", onDocClick); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const gap = 6;
    const minH = 176;
    const fitsBelow = window.innerHeight - r.bottom >= minH;
    const top = fitsBelow ? r.bottom + gap : Math.max(8, r.top - minH - gap);
    const left = Math.min(r.left, window.innerWidth - 224);
    setPos({ left, top });
  }, [open]);

  async function pick(id: number) {
    try {
      await addResult(runId, caseId, { statusId: id, comment: "" });
      onChanged(id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to update status";
      if (notify) notify("error", msg);
      else console.error(msg);
    } finally {
      setOpen(false);
    }
  }

  const commonBadge = "inline-flex items-center gap-2 rounded-2xl px-3 py-1 text-sm transition";
  const label = meta?.label ?? "Untested";
  const dotCls = meta?.dot ?? "bg-slate-400";
  const light = meta?.lightBadge ?? "ring-1 ring-slate-300/70 bg-white text-slate-900";
  const dark = meta?.darkBadge ?? "ring-1 ring-slate-700/50 bg-slate-800 text-slate-100";

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className={`${commonBadge} ${light} dark:${dark} border-0`}
        title="Change status"
        aria-haspopup="menu"
        aria-expanded={open}
        type="button"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dotCls}`} />
        {label}
        <ChevronDownIcon className="opacity-70" />
      </button>

      {open && pos && (
        <div
          ref={panelRef}
          style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 1100, maxHeight: "40vh" }}
          className="w-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-[#0f1524]"
          role="menu"
        >
          {RESULT_CHOICES.map((opt) => (
            <button
              key={opt.key}
              onClick={() => pick(opt.id)}
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-[15px] text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/60"
              role="menuitem"
              type="button"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${opt.dot}`} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RunStatusField;
