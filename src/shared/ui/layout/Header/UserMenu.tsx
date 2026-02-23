import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

function MenuPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}

export interface UserMenuProps {
  fullName?: string | null;
  email?: string | null;
  onProfile: () => void;
  onLogout: () => void;
}

export function UserMenu({
  fullName,
  email,
  onProfile,
  onLogout,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, w: 256 });

  const display = (fullName && fullName.trim()) || email || "";
  const initials =
    display
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || "")
      .join("") || "U";

  function place() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 256;
    const left = Math.max(12, Math.min(r.right - width, window.innerWidth - width - 12));
    const top = r.bottom + 10;
    setPos({ top, left, w: width });
  }

  useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    const onResize = () => place();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      const menu = document.getElementById("user-menu-portaled");
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-xl border px-3 text-sm outline-none transition
                   focus-visible:ring-2 focus-visible:ring-slate-400/25
                   bg-white/90 text-slate-900 border-slate-300 hover:border-slate-400
                   dark:bg-[#0b1222]/70 dark:text-slate-100 dark:border-slate-700/60 dark:hover:border-slate-500 dark:focus-visible:ring-slate-600/25"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
          {initials}
        </span>
        <span className="max-w-[11rem] truncate">{display}</span>
        <svg
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.2l3.71-3.97a.75.75 0 111.08 1.04l-4.24 4.53a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <MenuPortal>
          <div
            id="user-menu-portaled"
            role="menu"
            className="animate-in fixed z-[999] w-64 rounded-xl border p-2 backdrop-blur-md shadow-[0_20px_60px_-10px_rgba(0,0,0,.20)]
                       bg-white/95 border-slate-200
                       dark:bg-[#0f1524]/95 dark:border-slate-700/70 dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,.6)]"
            style={{ top: pos.top, left: pos.left, width: pos.w }}
          >
            <div className="p-2 mb-2 text-xs rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
              Signed in as <span className="text-slate-900 dark:text-slate-200">{email}</span>
            </div>

            <button
              role="menuitem"
              onClick={() => {
                onProfile();
                setOpen(false);
              }}
              className="flex items-center w-full gap-2 px-3 py-2 text-sm transition rounded-lg group text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/40"
            >
              <span className="grid w-6 h-6 border rounded place-items-center border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 20c1.8-3.8 13.2-3.8 16 0" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              Profile
            </button>

            <button
              role="menuitem"
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
              className="flex items-center w-full gap-2 px-3 py-2 mt-1 text-sm transition rounded-lg group text-rose-600 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-900/30 dark:hover:text-rose-100"
            >
              <span className="grid w-6 h-6 border rounded place-items-center border-rose-300 text-rose-500 dark:border-rose-500/40 dark:text-rose-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M11 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M15 4h2a3 3 0 013 3v10a3 3 0 01-3 3h-2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              Logout
            </button>
          </div>
        </MenuPortal>
      )}
    </>
  );
}

