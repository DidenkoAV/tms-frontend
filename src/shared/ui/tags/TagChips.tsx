import { useState } from "react";

export type ChipSize = "sm" | "md";

export function TagChip({
  label, size = "md", deletable, onDelete,
}: { label: string; size?: ChipSize; deletable?: boolean; onDelete?: () => void }) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-[5px] text-[12px]";
  return (
    <span className={`inline-flex items-center rounded-md ring-1 ${pad} bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700`}>
      {label}
      {deletable && (
        <button
          type="button"
          onClick={onDelete}
          className="ml-2 rounded px-1 text-slate-400 hover:text-slate-200"
          title="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function TagChips({
  tags, size = "md", editable = false, onChange, placeholder = "Add tag",
}: {
  tags: string[];
  size?: ChipSize;
  editable?: boolean;
  onChange?: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const normalize = (s: string) => s.trim();
  const addOne = (raw: string) => {
    const t = normalize(raw);
    if (!t || !onChange) return;
    const exists = tags.some(x => x.toLowerCase() === t.toLowerCase());
    if (!exists) onChange([...tags, t]);
  };
  const addMany = (raw: string) => {
    const parts = raw.split(/[,;\n]+/g).map(normalize).filter(Boolean);
    if (!parts.length || !onChange) return;
    const lower = new Set(tags.map(x => x.toLowerCase()));
    const next = [...tags];
    for (const p of parts) {
      const pl = p.toLowerCase();
      if (!lower.has(pl)) { next.push(p); lower.add(pl); }
    }
    onChange(next);
  };
  const removeAt = (i: number) => onChange?.(tags.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => (
        <TagChip key={`${t}-${i}`} label={t} size={size} deletable={editable} onDelete={() => removeAt(i)} />
      ))}

      {editable && (
        <div className="flex items-stretch gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addOne(draft);
                setDraft("");
              } else if (e.key === "Backspace" && draft === "" && tags.length) {
                e.preventDefault();
                removeAt(tags.length - 1);
              }
            }}
            onBlur={() => { if (draft.trim()) { addOne(draft); setDraft(""); } }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (/[,\n;]/.test(text)) {
                e.preventDefault();
                addMany(text);
                setDraft("");
              }
            }}
            placeholder={placeholder}
            className="rounded-md border px-2 py-1 text-xs outline-none border-slate-300 bg-white text-slate-700 placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
          />
          <button
            type="button"
            onClick={() => { addOne(draft); setDraft(""); }}
            className="rounded-md border px-2 py-1 text-xs border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
          >
            Add
          </button>
        </div>
      )}

      {!tags.length && !editable && <span className="text-xs text-slate-500">—</span>}
    </div>
  );
}

export default TagChips;
