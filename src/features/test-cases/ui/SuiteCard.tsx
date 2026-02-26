import type { ReactNode } from "react";
import { TFCheckbox } from "@/shared/ui/table";
import { ChevronRightIcon, EditIcon, PlusIcon } from "@/shared/ui/icons";

const pillSm =
  "inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs leading-none " +
  "border-slate-300 text-slate-800 bg-white/80 hover:bg-white hover:shadow-sm transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 " +
  "dark:border-slate-700 dark:text-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:focus-visible:ring-violet-400/30";

export type SuiteCardProps = {
  zoneKey: string;
  title: ReactNode | string;
  icon: ReactNode;
  description?: string | null;
  children?: ReactNode;

  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onAddSubsuite?: () => void;
  depth?: number;

  sortDir: "asc" | "desc";
  onToggleSort: () => void;

  // DnD
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;

  cols: Record<"priority"|"type"|"automation"|"author", boolean>;
  itemsCount: number;
  hasChildSuites?: boolean;

  // selection
  suiteSelectable: boolean;
  suiteChecked: boolean;
  suiteIndeterminate: boolean;
  onSuiteCheck: (v: boolean) => void;

  // rename
  showRename: boolean;
  onStartRename: () => void;
  isRenaming: boolean;
  renameName: string;
  setRenameName: (s: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;

  // grid template for header
  gridCols: string;
};

export default function SuiteCard(props: SuiteCardProps) {
  const {
    zoneKey, title, icon, description, children, open, onToggle, onAdd, onAddSubsuite, depth = 0,
    sortDir, onToggleSort, onDragOver, onDrop, cols, itemsCount, hasChildSuites = false,
    suiteSelectable, suiteChecked, suiteIndeterminate, onSuiteCheck,
    showRename, onStartRename, isRenaming, renameName, setRenameName, onSaveRename, onCancelRename,
    gridCols,
  } = props;

  return (
    <div
      className="rounded-2xl bg-white shadow-sm dark:bg-[#0f1524]"
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDrop={onDrop}
      data-zone={zoneKey}
    >
      {/* header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center min-w-0 gap-3">
            {suiteSelectable && (
              <TFCheckbox
                checked={suiteChecked}
                indeterminate={suiteIndeterminate}
                onChange={onSuiteCheck}
                title={suiteChecked ? "Unselect suite" : "Select suite"}
                size={18}
              />
            )}

            <span className="inline-flex items-center justify-center flex-none w-8 h-8 rounded bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
              {icon}
            </span>

            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center justify-center flex-none w-8 h-8 rounded text-slate-400 hover:text-slate-700 dark:text-slate-300"
              aria-expanded={open}
              title={open ? "Collapse" : "Expand"}
            >
              <ChevronRightIcon className={`transition-transform ${open ? "rotate-90" : ""}`} />
            </button>

            <span className="min-w-0">
              {!isRenaming ? (
                <>
                  <span className="block text-base font-semibold truncate text-slate-900 dark:text-white">
                    {title}
                  </span>
                  {description && (
                    <span className="block text-xs truncate text-slate-500 dark:text-slate-400">
                      {description}
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <input
                    className="w-[20rem] max-w-full rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); onSaveRename(); }}
                    disabled={!renameName.trim()}
                    className="rounded-full border px-2.5 py-1 text-xs font-semibold text-white border-slate-300 bg-slate-900 disabled:opacity-50 dark:text-black dark:bg-white dark:border-slate-500"
                    title="Save"
                  >✓</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancelRename(); }}
                    className="px-2 py-1 text-xs border rounded-2xl border-slate-300 dark:border-slate-600"
                    title="Cancel"
                  >✕</button>
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center flex-none gap-2 ml-3">
            <button type="button" onClick={onAdd} className={pillSm} title="Add case">
              <PlusIcon /> Case
            </button>
            {onAddSubsuite && depth < 4 && (
              <button type="button" onClick={onAddSubsuite} className={pillSm} title="Add subsuite">
                <PlusIcon /> Subsuite
              </button>
            )}
            <button type="button" onClick={onToggleSort} className={pillSm} title={`Sort by Title (${sortDir === "asc" ? "A→Z" : "Z→A"})`}>
              <span className="text-base leading-none">{sortDir === "asc" ? "↑" : "↓"}</span>
            </button>
            {showRename && (
              <button type="button" onClick={onStartRename} className={pillSm} title="Rename suite">
                <EditIcon /> Rename
              </button>
            )}
          </div>
        </div>
      </div>

      {/* body */}
      {open && (
        <div className="px-4 pb-3">
          {/* Table header - only show when there are cases (not just child suites) */}
          {itemsCount > 0 && (
            <div className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-[#0b1222]">
              <div className="grid gap-2" style={{ gridTemplateColumns: gridCols }}>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Case</div>
                {cols.priority  && <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Priority</div>}
                {cols.type      && <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</div>}
                {cols.automation&& <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Automation</div>}
                {cols.author    && <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Author</div>}
                <div />
              </div>
            </div>
          )}

          {/* Cases list or empty state */}
          {itemsCount > 0 ? (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#0b1222]">
              {children}
            </ul>
          ) : !hasChildSuites ? (
            <div className="p-4 text-sm border border-dashed rounded-xl border-slate-300 text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
              No cases. Click <b>Case</b> to add one.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
