import type { ReactNode } from "react";
import { MarkdownBlock } from "@/shared/ui/markdown/TinyMarkdown";

interface Props {
  value: string;
  preview?: boolean;
  onChange?: (value: string) => void;
  onTogglePreview?: (checked: boolean) => void;
  heading?: string;
  actions?: ReactNode;
  showHeader?: boolean;
  className?: string;
}

export default function CasePreconditionsBlock({
  value,
  preview = false,
  onChange,
  onTogglePreview,
  heading = "Preconditions",
  actions,
  showHeader = true,
  className,
}: Props) {
  const editing = typeof onChange === "function";

  const wrapperClasses = [
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
    "dark:border-slate-800 dark:bg-[#0f1524]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Textarea has border only in edit mode
  const textareaClasses = [
    "w-full min-h-[120px] rounded-2xl bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-500",
    "dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-cyan-400",
    editing ? "border border-slate-300 dark:border-slate-700" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClasses}>
      {showHeader && (
        <header className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700 dark:text-slate-300">
            {heading}
          </h2>
          <div className="flex items-center gap-2">
            {editing && onTogglePreview && (
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={preview}
                  onChange={(e) => onTogglePreview(e.target.checked)}
                />
                Preview
              </label>
            )}
            {actions}
          </div>
        </header>
      )}

      {editing ? (
        preview && onTogglePreview ? (
          <div className="min-h-[120px] rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0b1222]">
            <MarkdownBlock text={value} />
          </div>
        ) : (
          <textarea
            className={textareaClasses}
            placeholder="Markdown supported. Use ``` for code blocks."
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )
      ) : (
        <div className="min-h-[90px] rounded-2xl bg-white p-3 dark:bg-[#0b1222]">
          <MarkdownBlock text={value} />
        </div>
      )}
    </section>
  );
}
