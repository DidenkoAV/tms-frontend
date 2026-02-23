import { MarkdownBlock } from "@/shared/ui/markdown/TinyMarkdown";
import { EditIcon } from "@/shared/ui/icons";

type InlineProps = {
  mode?: "inline";
  value: string;
  draft: string;
  editing: boolean;
  onChangeDraft: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
};

type FormProps = {
  mode: "form";
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
};

type Props = InlineProps | FormProps;

const sectionClasses =
  "rounded-2xl border p-4 border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1524]";
const textareaClasses =
  "min-h-[120px] w-full rounded-2xl border p-3 outline-none border-slate-300 bg-white text-slate-800 focus:border-slate-400 dark:border-slate-800 dark:bg-[#0b1222] dark:text-slate-200 dark:focus:border-slate-600";
const btnBase = "inline-flex items-center rounded-2xl border transition";
const btnSm = "px-3 py-1.5 text-sm";
const btnGhost =
  "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500";

export default function CaseActualResult(props: Props) {
  if (props.mode === "form") {
    const { value, onChange, label = "Actual result", placeholder } = props;
    return (
      <div className={sectionClasses}>
        <label className="block mb-2 text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <textarea
          className={textareaClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Describe what actually happened..."}
        />
      </div>
    );
  }

  const { value, draft, editing, onChangeDraft, onSave, onCancel, onEdit } = props;

  return (
    <div className={sectionClasses}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700 dark:text-slate-300">
          Actual result
        </h2>
        {!editing ? (
          <button onClick={onEdit} className={[btnBase, btnSm, btnGhost].join(" ")}>
            <EditIcon className="mr-1" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={onSave} className={[btnBase, btnSm, btnGhost].join(" ")}>
              Save
            </button>
            <button onClick={onCancel} className={[btnBase, btnSm, btnGhost].join(" ")}>
              Cancel
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea
          className={textareaClasses}
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
        />
      ) : (
        <MarkdownBlock text={value} />
      )}
    </div>
  );
}
