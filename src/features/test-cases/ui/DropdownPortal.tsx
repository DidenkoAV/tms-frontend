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
      className="rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-[#0f1524]"
    >
      {children}
    </div>,
    document.body
  );
}

export function MenuItem({
  active, label, onClick,
}: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm",
        active
          ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/70",
      ].join(" ")}
    >
      <span>{label}</span>
      {active && <span className="text-xs opacity-70">✓</span>}
    </button>
  );
}
