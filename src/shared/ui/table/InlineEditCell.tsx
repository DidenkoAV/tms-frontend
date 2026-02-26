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
  onClick?: (e: React.MouseEvent) => void;
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
  onClick,
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
          onClick={(e) => {
            if (onClick) onClick(e);
            onViewClick(id);
          }}
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
        className="w-full max-w-[600px] truncate rounded-lg border-2 border-blue-400 bg-white px-3 py-1.5 text-[15px] font-medium
                   outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                   dark:border-blue-500 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/50
                   transition-all"
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
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full mb-2 flex gap-1.5
                      rounded-lg bg-white dark:bg-slate-800 px-1.5 py-1 shadow-lg border border-slate-200 dark:border-slate-700 z-30">
        {/* Save button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(id);
          }}
          disabled={!draft.trim() || saving}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                     bg-slate-900 text-white hover:bg-slate-700
                     dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
          title="Save (Enter)"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Save
        </button>

        {/* Cancel button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                     bg-slate-200 text-slate-700 hover:bg-slate-300
                     dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600
                     transition-colors"
          title="Cancel (Esc)"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
      </div>
    </div>
  );
}
