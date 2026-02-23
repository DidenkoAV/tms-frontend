import { useEffect, useRef } from "react";

interface Props {
  id: number;
  value: string;
  isEditing: boolean;
  draft: string;
  setDraft: (s: string) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
  saving?: boolean;
  fontSize?: string;
  onViewClick?: (id: number) => void;
  viewClassName?: string;
}

export default function InlineEditCell({
  id,
  value,
  isEditing,
  draft,
  setDraft,
  onSave,
  onCancel,
  saving = false,
  fontSize = "text-[15px]",
  onViewClick,
  viewClassName = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!isEditing) {
    const baseClasses = `block truncate font-medium ${fontSize} text-slate-900 dark:text-white`;
    if (onViewClick) {
      return (
        <button
          type="button"
          className={`${baseClasses} text-left focus:outline-none hover:underline ${viewClassName}`}
          title={value}
          onClick={() => onViewClick(id)}
        >
          {value}
        </button>
      );
    }

    return (
      <span
        className={`${baseClasses} ${viewClassName}`}
        title={value}
      >
        {value}
      </span>
    );
  }

  return (
    <div className="relative">
      {/* input */}
      <input
        ref={inputRef}
        className="w-full max-w-[220px] truncate rounded border border-slate-300 bg-white px-2 py-1 text-sm
                   outline-none focus:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave(id);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      />

      {/* floating toolbar */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full mb-1 flex gap-1 
                      rounded-lg bg-white/95 dark:bg-slate-800/95 px-1.5 py-1 shadow-md z-30 transition">
        {/* Save button (outline, hover fill black) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(id);
          }}
          disabled={!draft.trim() || saving}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-900 
                     text-slate-900 text-[11px] hover:bg-slate-900 hover:text-white 
                     disabled:opacity-40"
          title="Save"
        >
          ✓
        </button>

        {/* Cancel button (outline grey, hover red) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex h-5 w-5 items-center justify-center rounded-full border 
                     border-slate-400 text-slate-500 text-[11px] hover:border-red-500 hover:text-red-500
                     dark:border-slate-500 dark:text-slate-300"
          title="Cancel"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
