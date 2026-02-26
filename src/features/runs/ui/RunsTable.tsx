import { useNavigate } from "react-router-dom";
import { FavSortHeader, SortHeader } from "@/shared/ui/table/ColumnSortButton";
import { TFCheckbox, TableRowActions } from "@/shared/ui/table";
import { OpenIcon, EditIcon, TrashIcon, StarIcon } from "@/shared/ui/icons";
import { RunBreakdown } from "@/shared/ui/breakdown/RunBreakdown";
import AuthorCell from "@/shared/ui/table/AuthorCell";
import Pagination from "@/shared/ui/pagination/Pagination";
import InlineEditCell from "@/shared/ui/table/InlineEditCell";
import RowHighlight from "@/shared/ui/table/RowHighlight";
import RunStatusPicker, {
  type StatusPickerOption,
} from "@/shared/ui/table/RunStatusPicker";

type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";

type RunStats = {
  total: number;
  counts: Record<StatusKey, number>;
  passRate: number;
};

type SortBy = "name" | "fav" | "author" | "status";
type SortDir = "asc" | "desc";

interface Props {
  projectId: number;
  items: any[];
  pagedItems: any[];
  stats: Record<number, RunStats>;
  statsLoading: boolean;
  favorites: Set<number>;
  selectedIds: Set<number>;
  setSelectedIds: (next: Set<number>) => void;

  cols: { status: boolean; author: boolean };
  sortBy: SortBy;
  sortDir: SortDir;
  setSortBy: (v: SortBy) => void;
  setSortDir: (v: SortDir) => void;

  loading: boolean;
  err?: string | null;

  toggleSelect: (id: number, v?: boolean) => void;
  toggleFavorite: (id: number) => void;
  doDeleteRun: (run: any) => void;

  // change status Open/Closed
  toggleClosed: (id: number, closed: boolean) => void;

  confirmDlg: {
    open: (message: string, onConfirm: () => void) => void;
  };

  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  setPage: (v: number | ((p: number) => number)) => void;
  setPageSize: (v: number) => void;

  freezeSort: boolean;
  setFreezeSort: (v: boolean) => void;

  needPad: boolean;
  colCount: number;

  editingRunId: number | null;
  draftRunName: string;
  setDraftRunName: (s: string) => void;
  startEditRun: (r: any) => void;
  cancelEditRun: () => void;
  saveEditRun: (id: number) => void;
  savingRun: boolean;
}

const RUN_STATE_OPTIONS: StatusPickerOption[] = [
  {
    id: 0,
    label: "Open",
    badge:
      "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 focus:ring-emerald-300 dark:text-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-600",
    dot: "bg-emerald-500 dark:bg-emerald-300",
  },
  {
    id: 1,
    label: "Closed",
    badge:
      "text-slate-600 bg-white border border-slate-300 hover:border-slate-400 focus:ring-slate-300 dark:text-slate-200 dark:bg-slate-800/70 dark:border-slate-600",
    dot: "bg-slate-500 dark:bg-slate-300",
  },
];

const RUN_STATE_WIDTH = 110;

const RUN_STATE_ID = {
  OPEN: 0,
  CLOSED: 1,
};

export default function RunTable(props: Props) {
  const {
    projectId,
    items,
    pagedItems,
    stats,
    statsLoading,
    favorites,
    selectedIds,
    setSelectedIds,
    cols,
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    loading,
    err,
    toggleSelect,
    toggleFavorite,
    doDeleteRun,
    toggleClosed,
    confirmDlg,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    freezeSort,
    setFreezeSort,
    needPad,
    colCount,
    editingRunId,
    draftRunName,
    setDraftRunName,
    startEditRun,
    cancelEditRun,
    saveEditRun,
    savingRun,
  } = props;

  const navigate = useNavigate();
  const starSize = 17;

  const nextDirIfSameElseDesc = (isSame: boolean) =>
    (isSame ? (sortDir === "asc" ? "desc" : "asc") : "desc") as SortDir;

  const padX = "px-4";
  const padY = "py-3";
  const rowText = "text-[13px] leading-[1.35]";
  const headLabel =
    "text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500";
  const SELECT_ROW = "bg-emerald-50/80 dark:bg-white/10";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1524] overflow-hidden mt-3">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-[#0f1524]/90">
            <tr className={`${headLabel} text-left`}>
              <th className={`${padX} ${padY}`}>
                <TFCheckbox
                  title="Select all on page"
                  checked={
                    pagedItems.length > 0 &&
                    pagedItems.every((r) => selectedIds.has(r.id))
                  }
                  onChange={(v) => {
                    const ns = new Set(selectedIds);
                    pagedItems.forEach((r) =>
                      v ? ns.add(r.id) : ns.delete(r.id)
                    );
                    setSelectedIds(ns);
                  }}
                />
              </th>

              <th className={`${padX} ${padY} w-[44px]`}>
                <FavSortHeader
                  active={sortBy === "fav"}
                  dir={sortDir}
                  onToggle={() => {
                    const isSame = sortBy === "fav";
                    setSortBy("fav");
                    setSortDir(nextDirIfSameElseDesc(isSame));
                  }}
                />
              </th>

              <th className={`${padX} ${padY}`}>
                <SortHeader
                  label="Name"
                  active={sortBy === "name"}
                  dir={sortDir}
                  onToggle={() => {
                    const isSame = sortBy === "name";
                    setSortBy("name");
                    setSortDir(nextDirIfSameElseDesc(isSame));
                  }}
                />
              </th>

              <th className={`${padX} ${padY} w-[420px]`}>
                {cols.status && <span className={headLabel}>Status</span>}
              </th>

              <th className={`${padX} ${padY} w-[240px]`}>
                {cols.author && (
                  <SortHeader
                    label="Author"
                    active={sortBy === "author"}
                    dir={sortDir}
                    onToggle={() => {
                      const isSame = sortBy === "author";
                      setSortBy("author");
                      setSortDir(nextDirIfSameElseDesc(isSame));
                    }}
                  />
                )}
              </th>

              <th className={`${padX} ${padY} text-right w-[160px]`}>
                <span className={`${headLabel} inline-block text-right`}>
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody className={`${rowText} align-middle`}>
            {loading && (
              <tr>
                <td
                  colSpan={colCount}
                  className={`${padX} ${padY} text-slate-500 dark:text-slate-400`}
                >
                  Loading runs…
                </td>
              </tr>
            )}

            {!loading && !items.length && (
              <tr>
                <td
                  colSpan={colCount}
                  className={`${padX} ${padY} text-slate-500 dark:text-slate-400`}
                >
                  No runs found.
                </td>
              </tr>
            )}

            {pagedItems.map((r) => {
              const fav = favorites.has(r.id);
              const selected = selectedIds.has(r.id);
              const st = stats[r.id] || {
                total: 0,
                counts: {
                  PASSED: 0,
                  RETEST: 0,
                  FAILED: 0,
                  SKIPPED: 0,
                  BROKEN: 0,
                },
                passRate: 0,
              };
              const breakdownLoading = statsLoading && !stats[r.id];

              const isClosed = !!r.closed;

              return (
                <RowHighlight
                  key={r.id}
                  selected={selected}
                  selectedClassName={SELECT_ROW}
                  hoverClassName=""
                  onClick={() =>
                    navigate(`/projects/${projectId}/runs/${r.id}`)
                  }
                  className="transition cursor-pointer"
                >
                  {/* Checkbox */}
                  <td className={`${padX} ${padY}`}>
                    <TFCheckbox
                      stop
                      checked={selected}
                      onChange={(v) => toggleSelect(r.id, v)}
                      title={selected ? "Unselect" : "Select"}
                    />
                  </td>

                  {/* Favorite */}
                  <td className={`${padX} ${padY}`}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-yellow-400 rounded-md h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFreezeSort(true);
                        toggleFavorite(r.id);
                        setTimeout(() => setFreezeSort(false), 400);
                      }}
                      title={
                        fav
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <StarIcon filled={fav} size={starSize} />
                    </button>
                  </td>

                  {/* Name */}
                  <td className={`${padX} ${padY}`}>
                    <InlineEditCell
                      id={r.id}
                      value={r.name}
                      isEditing={editingRunId === r.id}
                      draft={draftRunName}
                      setDraft={setDraftRunName}
                      onSave={saveEditRun}
                      onCancel={cancelEditRun}
                      saving={savingRun}
                    />
                  </td>

                  {/* Status (dropdown + breakdown bar) */}
                  <td className={`${padX} ${padY} w-[420px]`}>
                    {cols.status && (
                      <div className="flex w-full items-start gap-5">
                        <div className="shrink-0 pt-0.5">
                          <RunStatusPicker
                            valueId={
                              isClosed ? RUN_STATE_ID.CLOSED : RUN_STATE_ID.OPEN
                            }
                            onChange={(next) =>
                              toggleClosed(r.id, next === RUN_STATE_ID.CLOSED)
                            }
                            options={RUN_STATE_OPTIONS}
                            width={RUN_STATE_WIDTH}
                          />
                        </div>
                        <div className="flex-1">
                          <RunBreakdown
                            total={st.total}
                            counts={st.counts as any}
                            loading={breakdownLoading}
                          />
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Author */}
                  <td className={`${padX} ${padY} w-[120px]`}>
                    {cols.author && (
                      <AuthorCell
                        name={r.createdByName}
                        email={r.createdByEmail}
                        userId={r.createdBy ?? 0}
                      />
                    )}
                  </td>

                  {/* Actions */}
                  <td className={`${padX} ${padY}`}>
                    <TableRowActions
                      actions={[
                        {
                          key: "open",
                          title: "Open",
                          variant: "ghost",
                          icon: <OpenIcon />,
                          onClick: () =>
                            navigate(
                              `/projects/${projectId}/runs/${r.id}`
                            ),
                        },
                        {
                          key: "edit",
                          title: "Edit name",
                          icon: <EditIcon />,
                          hidden: editingRunId === r.id,
                          onClick: () => startEditRun(r),
                        },
                        {
                          key: "delete",
                          title: "Delete",
                          variant: "danger",
                          icon: <TrashIcon />,
                          onClick: () =>
                            confirmDlg.open(
                              `Delete run "${r.name}"?`,
                              () => doDeleteRun(r)
                            ),
                        },
                      ]}
                    />
                  </td>
                </RowHighlight>
              );
            })}

            {needPad && (
              <tr>
                <td colSpan={colCount}>
                  <div
                    style={{ height: 300 }}
                    className="pointer-events-none"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        className={rowText}
      />

      {err && (
        <div className="m-3 text-sm text-red-600 dark:text-red-400">
          {err}
        </div>
      )}
    </section>
  );
}
