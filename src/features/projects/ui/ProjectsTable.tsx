// src/features/projects/components/ProjectsTable.tsx
import { useNavigate } from "react-router-dom";
import { FavSortHeader, SortHeader } from "@/shared/ui/table/ColumnSortButton";
import { TFCheckbox } from "@/shared/ui/table";
import { AlertBanner } from "@/shared/ui/alert";
import { EditIcon, TrashIcon, OpenIcon, StarIcon } from "@/shared/ui/icons";
import Pagination from "@/shared/ui/pagination/Pagination";
import RowHighlight from "@/shared/ui/table/RowHighlight";
import TableRowActions from "@/shared/ui/table/TableRowActions";

type Project = {
  id: number;
  name: string;
  code: string;
  groupId: number;
  groupName?: string;
  groupPersonal?: boolean;
};

type ProjectStat = { suites: number; cases: number; runs: number; milestones: number };
type Stats = Record<number, ProjectStat>;
type SortBy = "name" | "fav" | "group";
type SortDir = "asc" | "desc";

interface Props {
  items: Project[];
  pagedItems: Project[];
  stats: Stats;
  favorites: Set<number>;
  selectedIds: Set<number>;
  setSelectedIds: (next: Set<number>) => void;

  cols: { code: boolean; meta: boolean; group: boolean };
  sortBy: SortBy;
  sortDir: SortDir;

  loading: boolean;
  err?: string | null;

  toggleSelect: (id: number, v?: boolean) => void;
  toggleFavorite: (id: number) => void;
  doDeleteProject: (p: Project) => void;

  confirmDlg: {
    open: (message: string, onConfirm: () => void) => void;
  };

  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  setPage: (v: number | ((p: number) => number)) => void;
  setPageSize: (v: number) => void;

  setSortBy: (v: SortBy) => void;
  setSortDir: (v: SortDir) => void;

  freezeSort: boolean;
  setFreezeSort: (v: boolean) => void;

  needPad: boolean;
  colCount: number;
  SELECT_ROW: string;

  banner: { kind: "error" | "info"; text: string } | null;
  setBanner: (v: { kind: "error" | "info"; text: string } | null) => void;

  projectNameTable?: string;

  renderName: (p: Project) => React.ReactNode;

  setEditingId: (id: number | null) => void;
  setEditName: (v: string) => void;
}

export default function ProjectsTable(props: Props) {
  const {
    items,
    pagedItems,
    stats,
    favorites,
    selectedIds,
    setSelectedIds,
    cols,
    sortBy,
    sortDir,
    loading,
    err,
    toggleSelect,
    toggleFavorite,
    doDeleteProject,
    confirmDlg,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    setSortBy,
    setSortDir,
    setFreezeSort,
    needPad,
    colCount,
    SELECT_ROW,
    banner,
    renderName,
    setEditingId,
    setEditName,
  } = props;

  const navigate = useNavigate();

  const nextDirIfSameElseDesc = (isSame: boolean) =>
    (isSame ? (sortDir === "asc" ? "desc" : "asc") : "desc") as SortDir;

  const onToggleFavSort = () => {
    const isSame = sortBy === "fav";
    setSortBy("fav");
    setSortDir(nextDirIfSameElseDesc(isSame));
  };
  const onToggleNameSort = () => {
    const isSame = sortBy === "name";
    setSortBy("name");
    setSortDir(nextDirIfSameElseDesc(isSame));
  };
  const onToggleGroupSort = () => {
    const isSame = sortBy === "group";
    setSortBy("group");
    setSortDir(nextDirIfSameElseDesc(isSame));
  };

  const STAT_KEYS = ["suites", "cases", "runs", "milestones"] as const;

  const padX = "px-4";
  const padY = "py-3";
  const rowText = "text-sm";
  const headLabel =
    "text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500";
  const starSize = 17;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1524] overflow-hidden">
      {banner && <AlertBanner kind={banner.kind}>{banner.text}</AlertBanner>}

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-[#0f1524]/90">
            <tr className={`${headLabel} text-left`}>
              <th className={`${padX} ${padY}`}>
                <TFCheckbox
                  title="Select all on page"
                  checked={pagedItems.length > 0 && pagedItems.every((p) => selectedIds.has(p.id))}
                  onChange={(v) => {
                    const ns = new Set(selectedIds);
                    pagedItems.forEach((p) => (v ? ns.add(p.id) : ns.delete(p.id)));
                    setSelectedIds(ns);
                  }}
                />
              </th>

              <th className={`${padX} ${padY} w-[44px]`}>
                <FavSortHeader active={sortBy === "fav"} dir={sortDir} onToggle={onToggleFavSort} />
              </th>

              <th className={`${padX} ${padY}`}>
                <SortHeader label="Name" active={sortBy === "name"} dir={sortDir} onToggle={onToggleNameSort} />
              </th>

              {cols.group && (
                <th className={`${padX} ${padY}`}>
                  <SortHeader label="Group" active={sortBy === "group"} dir={sortDir} onToggle={onToggleGroupSort} />
                </th>
              )}

              {cols.code && (
                <th className={`${padX} ${padY}`}>
                  <span className={headLabel}>Code</span>
                </th>
              )}
              {cols.meta && (
                <th className={`${padX} ${padY}`}>
                  <span className={headLabel}>Meta</span>
                </th>
              )}
              <th className={`${padX} ${padY} w-[120px] text-right`}>
                <span className={`${headLabel} inline-block text-right`}>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className={rowText}>
            {loading && (
              <tr>
                <td className={`${padX} ${padY} text-slate-500 dark:text-slate-400`} colSpan={colCount}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && !items.length && (
              <tr>
                <td className={`${padX} ${padY} text-slate-500 dark:text-slate-400`} colSpan={colCount}>
                  No active projects.
                </td>
              </tr>
            )}

            {!loading && items.length > 0 && pagedItems.length === 0 && (
              <tr>
                <td className={`${padX} ${padY} text-slate-500 dark:text-slate-400`} colSpan={colCount}>
                  No projects match your search.
                </td>
              </tr>
            )}

            {pagedItems.map((p) => {
              const fav = favorites.has(p.id);
              const selected = selectedIds.has(p.id);

              return (
                <RowHighlight
                  key={p.id}
                  selected={selected}
                  selectedClassName={SELECT_ROW}
                  hoverClassName=""
                >
                  {/* Checkbox */}
                  <td className={`${padX} ${padY}`}>
                    <TFCheckbox
                      stop
                      checked={selected}
                      onChange={(v) => toggleSelect(p.id, v)}
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
                        toggleFavorite(p.id);
                        setTimeout(() => setFreezeSort(false), 400);
                      }}
                      title={fav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <StarIcon filled={fav} size={starSize} />
                    </button>
                  </td>

                  {/* Project name */}
                  <td
                    className={`${padX} ${padY} cursor-pointer`}
                    onClick={(e) => {
                      const tag = (e.target as HTMLElement).tagName;
                      if (["BUTTON", "INPUT", "A", "SVG", "PATH"].includes(tag)) return;
                      navigate(`/projects/${p.id}`);
                    }}
                  >
                    {renderName(p)}
                  </td>

                  {/* Group */}
                  {cols.group && (
                    <td className={`${padX} ${padY}`}>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white/70 px-2.5 py-1 text-[12px] text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                        {p.groupName}
                        {p.groupPersonal && <span className="text-[10px] opacity-60 ml-1">(personal)</span>}
                      </span>
                    </td>
                  )}

                  {/* Code */}
                  {cols.code && (
                    <td className={`${padX} ${padY}`}>
                      <span className="inline-flex h-6 items-center rounded-lg border border-slate-300 bg-white/70 px-1.5 text-[12px] leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 font-mono">
                        {p.code}
                      </span>
                    </td>
                  )}

                  {/* Meta */}
                  {cols.meta && (
                    <td className={`${padX} ${padY}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        {STAT_KEYS.map((key) => (
                          <span
                            key={key}
                            className="rounded-lg border border-slate-300 bg-white/70 px-2.5 py-1 text-[12px] text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                          >
                            {key[0].toUpperCase() + key.slice(1)}:
                            <b className="ml-1">{stats[p.id]?.[key] ?? 0}</b>
                          </span>
                        ))}
                      </div>
                    </td>
                  )}

                  {/* Actions */}
                  <td className={`${padX} ${padY}`}>
                    <TableRowActions
                      actions={[
                        {
                          key: "open",
                          title: "Open",
                          variant: "ghost",
                          icon: <OpenIcon />,
                          onClick: () => navigate(`/projects/${p.id}`),
                        },
                        {
                          key: "edit",
                          title: "Edit name",
                          icon: <EditIcon />,
                          onClick: () => {
                            setEditingId(p.id);
                            setEditName(p.name);
                          },
                        },
                        {
                          key: "delete",
                          title: "Delete",
                          variant: "danger",
                          icon: <TrashIcon />,
                          onClick: () => {
                            confirmDlg.open(`Delete project "${p.name}"?`, () => doDeleteProject(p));
                          },
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
                  <div style={{ height: 450 }} className="pointer-events-none" />
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
        <AlertBanner kind="error" className="m-3">
          {err}
        </AlertBanner>
      )}
    </section>
  );
}
