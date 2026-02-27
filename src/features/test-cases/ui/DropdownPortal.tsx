import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function DropdownPortal({
  open, anchor, onClose, width = 220, children,
}: { open: boolean; anchor: HTMLElement | null; onClose: () => void; width?: number; children: ReactNode }) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function compute() {
      if (!anchor) { setPos(null); return; }
      const r = anchor.getBoundingClientRect();
      setPos({ left: Math.round(r.left), top: Math.round(r.bottom + 6) });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [anchor]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (anchor && (anchor === t || anchor.contains(t))) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      onClose();
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, anchor, onClose]);

  if (!open || !anchor || !pos) return null;
  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "fixed", left: pos.left, top: pos.top, width, zIndex: 50 }}
      className="rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-[#0f1524]"
    >
      {children}
    </div>,
    document.body
  );
}

export function MenuItem({
  active, label, subtitle, onClick,
}: { active?: boolean; label: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition-colors",
        active
          ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/70",
      ].join(" ")}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-medium truncate">{label}</span>
        {subtitle && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {subtitle}
          </span>
        )}
      </div>
      {active && (
        <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 text-xs">✓</span>
      )}
    </button>
  );
}
