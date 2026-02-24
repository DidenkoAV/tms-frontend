// src/features/milestone/component/MilestoneRunsTable.tsx
import { Link } from "react-router-dom";
import { TFCheckbox } from "@/shared/ui/table";
import { FavSortHeader, SortHeader } from "@/shared/ui/table/ColumnSortButton";
import { IconButton } from "@/shared/ui/buttons";
import { TrashIcon, StarIcon } from "@/shared/ui/icons";
import AuthorCell from "@/shared/ui/table/AuthorCell";
import { RunBreakdown } from "@/shared/ui/breakdown/RunBreakdown";
import Pagination from "@/shared/ui/pagination/Pagination";
import RowHighlight from "@/shared/ui/table/RowHighlight";

const nameLinkClass =
  "min-w-0 text-[15px] sm:text-[16px] font-medium leading-[1.15] tracking-[-0.005em] " +
  "text-slate-900/95 dark:text-slate-100/95 hover:underline underline-offset-[3px] " +
  "decoration-slate-400/40 dark:decoration-slate-500/40 " +
  "selection:bg-sky-100 dark:selection:bg-violet-600/30";

type SortBy = "name" | "fav";
type SortDir = "asc" | "desc";

interface Props {
  runs: any[];
  runStats: Record<number, any>;
  cols: { breakdown: boolean; author: boolean };
  loading: boolean;
  runStatsLoading: boolean;
  projectId: number;
  milestoneId: number;
  askRemoveRun: (id: number) => void;
  dynamicColspan: number;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  setPage: (n: number | ((v: number) => number)) => void;
  setPageSize: (n: number) => void;

  // Sorting + favorites
  sortBy: SortBy;
  sortDir: SortDir;
  setSortBy: (v: SortBy) => void;
  setSortDir: (v: SortDir) => void;

  favorites: Set<number>;
  toggleFavorite: (id: number) => void;

  // Multi-select
  selectedIds: Set<number>;
  setSelectedIds: (next: Set<number>) => void;

  needPad: boolean;
  colCount: number;
}

export default function MilestoneRunsTable({
  runs,
  runStats,
  cols,
  loading,
  runStatsLoading,
  projectId,
  milestoneId,
  askRemoveRun,
  dynamicColspan,
  page,
  pageSize,
  totalPages,
  totalItems,
  setPage,
  setPageSize,
  sortBy,
  sortDir,
  setSortBy,
  setSortDir,
  favorites,
  toggleFavorite,
  selectedIds,
  setSelectedIds,
  needPad,
  colCount,
}: Props) {
  const starSize = 17;
  const padX = "px-4";
  const padY = "py-3";
  const rowText = "text-[13px] leading-[1.35]";
  const headLabel =
    "text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500";
  const SELECT_ROW = "bg-emerald-50/80 dark:bg-white/10";

  const nextDir = (same: boolean): SortDir =>
    same ? (sortDir === "asc" ? "desc" : "asc") : "desc";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1524] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold">Runs in milestone</h2>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {totalItems} total
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-[#0f1524]/90">
            <tr className={`${headLabel} text-left`}>
              {/* Select all */}
              <th className={`${padX} ${padY}`}>
                <TFCheckbox
                  title="Select all on page"
                  checked={runs.length > 0 && runs.every((r) => selectedIds.has(r.id))}
                  onChange={(v) => {
                    const ns = new Set(selectedIds);
                    runs.forEach((r) => (v ? ns.add(r.id) : ns.delete(r.id)));
                    setSelectedIds(ns);
                  }}
                />
              </th>

              {/* Fav */}
              <th className={`${padX} ${padY} w-[44px]`}>
                <FavSortHeader
                  active={sortBy === "fav"}
                  dir={sortDir}
                  onToggle={() => {
                    const same = sortBy === "fav";
                    setSortBy("fav");
                    setSortDir(nextDir(same));
                  }}
                />
              </th>

              {/* Name */}
              <th className={`${padX} ${padY} min-w-[220px]`}>
                <SortHeader
                  label="Name"
                  active={sortBy === "name"}
                  dir={sortDir}
                  onToggle={() => {
                    const same = sortBy === "name";
                    setSortBy("name");
                    setSortDir(nextDir(same));
                  }}
                />
              </th>

              <th className={`${padX} ${padY} w-[520px]`}>
                {cols.breakdown ? (
                  <span className={headLabel}>Breakdown</span>
                ) : (
                  <span className="invisible">Breakdown</span>
                )}
              </th>

              {/* Author */}
              <th className={`${padX} ${padY} w-[260px]`}>
                <span className={`${headLabel} block select-none`}>Author</span>
              </th>

              <th className={`${padX} ${padY} w-[90px] text-right`}>
                <span className={`${headLabel} inline-block text-right`}>
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody className={rowText}>
            {loading && (
              <tr>
                <td colSpan={colCount} className={`${padX} ${padY} text-slate-500 dark:text-slate-400`}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && runs.length === 0 && (
              <tr>
                <td colSpan={colCount} className={`${padX} ${padY} text-slate-500 dark:text-slate-400`}>
                  No runs yet.
                </td>
              </tr>
            )}

            {runs.map((r) => {
              const fav = favorites.has(r.id);
              const selected = selectedIds.has(r.id);
              const st = runStats[r.id] || { counts: {}, total: 0, passRate: 0 };
              const breakdownLoading = runStatsLoading && !runStats[r.id];

              return (
                <RowHighlight
                  key={r.id}
                  selected={selected}
                  selectedClassName={SELECT_ROW}
                  hoverClassName=""
                  className="transition-colors"
                >
                  {/* Checkbox */}
                  <td className={`${padX} ${padY}`}>
                    <TFCheckbox
                      stop
                      checked={selected}
                      onChange={(v) => {
                        const ns = new Set(selectedIds);
                        v ? ns.add(r.id) : ns.delete(r.id);
                        setSelectedIds(ns);
                      }}
                    />
                  </td>

                  {/* Favorite */}
                  <td className={`${padX} ${padY}`}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-yellow-400 rounded-md h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(r.id);
                      }}
                    >
                      <StarIcon filled={fav} size={starSize} />
                    </button>
                  </td>

                  {/* Name */}
                  <td className={`${padX} ${padY}`}>
                    <Link
                      to={{
                        pathname: `/projects/${projectId}/runs/${r.id}`,
                        search: `?milestoneId=${milestoneId}`,
                      }}
                      state={{ milestoneId, fromMilestone: true }}
                      className={nameLinkClass}
                    >
                      <span className="line-clamp-1">{r.name}</span>
                    </Link>
                    {r.description && (
                      <div className="text-slate-500 dark:text-slate-400">
                        {r.description}
                      </div>
                    )}
                  </td>

                  {/* Breakdown */}
                  <td className={`${padX} ${padY}`}>
                    {cols.breakdown ? (
                      <RunBreakdown counts={st.counts} total={st.total} loading={breakdownLoading} />
                    ) : (
                      <div className="invisible">Breakdown</div>
                    )}
                  </td>

                  {/* Author */}
                  <td className={`${padX} ${padY}`}>
                    {cols.author ? (
                      <AuthorCell
                        name={r.createdByName}
                        email={r.createdByEmail}
                        userId={r.createdBy ?? 0}
                      />
                    ) : (
                      <div className="invisible">Author</div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className={`${padX} ${padY}`}>
                    <div className="flex items-center justify-end">
                      <IconButton
                        variant="danger"
                        title="Remove from milestone"
                        onClick={() => askRemoveRun(r.id)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </td>
                </RowHighlight>
              );
            })}

            {needPad && (
              <tr>
                <td colSpan={colCount}>
                  <div style={{ height: 300 }} className="pointer-events-none" />
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
    </section>
  );
}
