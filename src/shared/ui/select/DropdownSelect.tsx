import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/shared/ui/icons";

export type PillOption<T extends string> = { value: T };

export function PillSelect<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: PillOption<T>[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <span>{String(value)}</span>
        <ChevronDownIcon className="ml-2 opacity-80" />
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-[#0f1524]">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex items-center w-full px-3 py-2 text-sm text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/60"
            >
              {String(opt.value)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PillSelect;
