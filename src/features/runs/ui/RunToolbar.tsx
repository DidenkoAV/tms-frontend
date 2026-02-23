// src/features/runs/components/RunToolbar.tsx
import { TrashIcon, PlusIcon } from "@/shared/ui/icons";
import ColumnsMenu from "@/shared/ui/columns/ColumnsMenu";

/* --- Modern Minimal Switch (black and white only, perfect geometry) --- */
function MiniSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-[16px] w-[30px] items-center rounded-full border transition-all duration-200
        ${
          checked
            ? "border-slate-900 bg-slate-900 dark:border-emerald-400 dark:bg-emerald-400"
            : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
        }`}
    >
      <span
        className={`ml-[2px] h-[12px] w-[12px] rounded-full bg-white transition-transform duration-200 dark:bg-slate-100
          ${checked ? "translate-x-[12px]" : "translate-x-0"}`}
      />
    </button>
  );
}

/* --- Column types --- */
export type VisibleCols = {
  status: boolean;
  type: boolean;
  priority: boolean;
  automation: boolean;
  author: boolean;
  jira: boolean;
};

type Props = {
  hideSuites: boolean;
  onToggleHideSuites: (v: boolean) => void;

  cols: VisibleCols;
  onChangeCols: (next: VisibleCols) => void;

  pickedCount: number;
  onRemovePicked: () => void;

  onClickAddCases: () => void;
};

export default function RunToolbar({
  hideSuites,
  onToggleHideSuites,
  cols,
  onChangeCols,
  pickedCount,
  onRemovePicked,
  onClickAddCases,
}: Props) {
  const controlButton =
    "inline-flex h-8 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 px-3 text-[12px] font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-200 " +
    "hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 " +
    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-600";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {pickedCount > 0 && (
        <button
          type="button"
          onClick={onRemovePicked}
          className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-500 shadow-sm transition hover:bg-rose-50 hover:shadow-md dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-900/30"
          title={`Delete ${pickedCount} selected`}
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      )}

      <label
        className="inline-flex h-8 items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 text-[12px] font-medium text-slate-500 dark:border-slate-700/70 dark:bg-white/5 dark:text-white/80"
        title="Toggle suite grouping"
      >
        <MiniSwitch checked={hideSuites} onChange={onToggleHideSuites} />
        <span>Hide suites</span>
      </label>

      <ColumnsMenu
        items={[
          { key: "status", label: "Status" },
          { key: "type", label: "Type" },
          { key: "priority", label: "Priority" },
          { key: "automation", label: "Automation" },
          { key: "author", label: "Author" },
          { key: "jira", label: "Bugs" },
        ]}
        value={cols}
        onChange={(next) => onChangeCols(next as VisibleCols)}
        buttonLabel="Columns"
      />

      <button
        type="button"
        onClick={onClickAddCases}
        className={controlButton}
      >
        <PlusIcon className="h-3 w-3" />
        Add cases
      </button>

    </div>
  );
}
