import { MarkdownBlock } from "@/shared/ui/markdown/TinyMarkdown";
import { EditIcon } from "@/shared/ui/icons";

interface Props {
  value: string;
  draft: string;
  editing: boolean;
  onChangeDraft: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export default function CaseTestData({
  value,
  draft,
  editing,
  onChangeDraft,
  onSave,
  onCancel,
  onEdit,
}: Props) {
  const section =
    "rounded-2xl border p-4 border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1524]";
  const btnBase = "inline-flex items-center rounded-2xl border transition";
  const btnSm = "px-3 py-1.5 text-sm";
  const btnGhost =
    "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500";

  return (
    <div className={section}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-700 dark:text-slate-300">
          Test data
        </h3>
        {!editing ? (
          <button
            onClick={onEdit}
            className={[btnBase, btnSm, btnGhost].join(" ")}
          >
            <EditIcon className="mr-1" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className={[btnBase, btnSm, btnGhost].join(" ")}
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className={[btnBase, btnSm, btnGhost].join(" ")}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea
          className="min-h-[90px] w-full rounded-2xl border p-3 outline-none border-slate-300 bg-white text-slate-800 focus:border-slate-400 dark:border-slate-800 dark:bg-[#0b1222] dark:text-slate-200 dark:focus:border-slate-600"
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
        />
      ) : (
        <MarkdownBlock text={value} />
      )}
    </div>
  );
}
