import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DatePickerProps {
  valueISO: string | null;
  onChangeISO: (iso: string | null) => void;
  placeholder?: string;
}

export default function DatePicker({
  valueISO,
  onChangeISO,
  placeholder = "Pick date…",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const initial = valueISO ? new Date(valueISO) : null;
  const [view, setView] = useState<Date>(() => initial || new Date());
  const [mode, setMode] = useState<"day" | "year">("day");

  useEffect(() => {
    if (!open || !btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
    const gap = 6,
      minH = 260;
    const top =
      window.innerHeight - r.bottom >= minH
        ? r.bottom + gap
        : Math.max(8, r.top - minH - gap);
    const width = mode === "year" ? 260 : 240;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ left, top });
  }, [open, mode]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: Array<Array<number | null>> = [];
  let cur = 1 - startDay;

  for (let r = 0; r < 6; r++) {
    const row: Array<number | null> = [];
    for (let c = 0; c < 7; c++) {
      row.push(cur >= 1 && cur <= daysInMonth ? cur : null);
      cur++;
    }
    rows.push(row);
  }

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(view);
  const valueLabel = valueISO
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(valueISO))
    : placeholder;

  const today = new Date();
  const isSameYMD = (a: Date, y: number, m: number, d: number) =>
    a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-[160px] px-2 py-1.5 text-sm text-left bg-white border rounded-lg border-slate-300 hover:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-800/60"
      >
        <span className={`${valueISO ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"} truncate`}>
          {valueLabel}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70 text-slate-500 dark:text-slate-300">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              zIndex: 1100,
              width: mode === "year" ? 260 : 240,
            }}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-[#12213d] dark:text-slate-100"
          >
            {mode === "year" ? (
              <YearGrid
                year={year}
                onSelect={(y) => {
                  setView(new Date(y, view.getMonth(), 1));
                  setMode("day");
                }}
                onClose={() => setOpen(false)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <button
                    className="px-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    onClick={() =>
                      setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
                    }
                  >
                    ‹
                  </button>
                  <div
                    className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-100"
                    onClick={() => setMode("year")}
                  >
                    {monthLabel}
                  </div>
                  <button
                    className="px-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    onClick={() =>
                      setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
                    }
                  >
                    ›
                  </button>
                </div>

                <div className="mb-1 grid grid-cols-7 text-center text-[10px] text-slate-400 dark:text-slate-400">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {rows.flat().map((d, idx) => {
                    const isSelected =
                      d !== null && valueISO && isSameYMD(new Date(valueISO), year, month, d);
                    const isToday = d !== null && isSameYMD(today, year, month, d);
                    return (
                      <button
                        key={idx}
                        disabled={d === null}
                        onClick={() => {
                          if (!d) return;
                          const base = new Date(year, month, d, 12);
                          onChangeISO(base.toISOString());
                          setOpen(false);
                        }}
                        className={[
                          "h-7 w-7 rounded text-xs transition-colors",
                          d === null
                            ? "opacity-20 cursor-default"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700/60",
                          isSelected ? "bg-sky-500 text-white" : "",
                          !isSelected && isToday
                            ? "ring-1 ring-slate-300 dark:ring-slate-500"
                            : "",
                        ].join(" ")}
                      >
                        {d ?? ""}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
const YearGrid = ({
  year,
  onSelect,
  onClose,
}: {
  year: number;
  onSelect: (y: number) => void;
  onClose: () => void;
}) => {
  const start = year - 9;
  const years = Array.from({ length: 18 }, (_, i) => start + i);
  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => onSelect(year - 10)}
          className="px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ‹
        </button>
        <span>
          {years[0]} - {years[years.length - 1]}
        </span>
        <button
          type="button"
          onClick={() => onSelect(year + 10)}
          className="px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onSelect(y)}
            className={`rounded-lg px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 ${
              y === year ? "bg-sky-500 text-white" : ""
            }`}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700 dark:text-slate-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};
