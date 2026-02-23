import { useEffect, useId, useRef } from "react";

type SearchInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  storageKey?: string;
  debounceMs?: number;
  onDebouncedChange?: (v: string) => void;
  autoFocus?: boolean;
  ariaLabel?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
  storageKey,
  debounceMs,
  onDebouncedChange,
  autoFocus,
  ariaLabel = "Search",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const id = useId();

  /* --- Restore saved value --- */
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved != null && saved !== value) onChange(saved);
    } catch {}
  }, [storageKey]);

  /* --- Persist value --- */
  useEffect(() => {
    if (!storageKey) return;
    try {
      if (value) localStorage.setItem(storageKey, value);
      else localStorage.removeItem(storageKey);
    } catch {}
  }, [value, storageKey]);

  /* --- Debounced change --- */
  useEffect(() => {
    if (!debounceMs || !onDebouncedChange) return;
    const t = setTimeout(() => onDebouncedChange(value), debounceMs);
    return () => clearTimeout(t);
  }, [value, debounceMs, onDebouncedChange]);

  return (
    <div
      className={`relative flex items-center w-[220px] sm:w-[260px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 focus-within:border-emerald-300/70 focus-within:shadow-[0_12px_38px_rgba(6,182,212,0.25)] dark:border-slate-700/70 dark:bg-slate-900/60 dark:shadow-[0_12px_34px_rgba(1,4,20,0.7)] dark:focus-within:border-emerald-400/60 dark:focus-within:shadow-[0_16px_38px_rgba(16,185,129,0.35)] ${className}`}
    >
      {/* Search icon */}
      <div className="absolute inset-y-0 flex items-center pointer-events-none left-3 text-slate-400 dark:text-slate-500">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Input */}
      <input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className="w-full bg-transparent py-2 pr-8 pl-9 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 transition-all hover:bg-slate-200/90 hover:text-slate-600 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label="Clear search"
          title="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
}
