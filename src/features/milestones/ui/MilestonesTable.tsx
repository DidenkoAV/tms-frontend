// src/features/milestones/components/MilestonesTable.tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FavSortHeader, SortHeader } from "@/shared/ui/table/ColumnSortButton";
import { TFCheckbox, TableRowActions } from "@/shared/ui/table";
import { EditIcon, TrashIcon, OpenIcon, StarIcon } from "@/shared/ui/icons";
import Pagination from "@/shared/ui/pagination/Pagination";
import AuthorCell from "@/shared/ui/table/AuthorCell";
import InlineEditCell from "@/shared/ui/table/InlineEditCell";
import RowHighlight from "@/shared/ui/table/RowHighlight";
import type { Milestone } from "@/entities/milestone";
import DatePicker from "@/shared/ui/datepicker/DatePicker";

/* =================== helpers =================== */
function DateBlock({
  start,
  due,
}: {
  start?: string | null;
  due?: string | null;
}) {
  const format = (iso?: string | null) => {
    if (!iso) return { date: "—", year: "" };
    const d = new Date(iso);
    return {
      date: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
      }).format(d),
      year: d.getFullYear().toString(),
    };
  };

  const startFmt = format(start);
  const dueFmt = format(due);

  return (
    <div className="flex items-center gap-3 text-[12px] text-slate-700 dark:text-slate-200">
      <div className="flex min-w-[56px] flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Start
        </span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {startFmt.date}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {startFmt.year}
        </span>
      </div>
      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
      <div className="flex min-w-[56px] flex-col gap-0.5 text-right">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Due
        </span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {dueFmt.date}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {dueFmt.year}
        </span>
      </div>
    </div>
  );
}

function DateEditor({
  startISO,
  dueISO,
  onChangeStart,
  onChangeDue,
  onCancel,
  onSave,
  saving,
  anchor,
}: {
  startISO: string | null;
  dueISO: string | null;
  onChangeStart: (iso: string | null) => void;
  onChangeDue: (iso: string | null) => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  anchor: HTMLElement | null;
}) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!anchor || !panelRef.current) return;
    const compute = () => {
      if (!anchor || !panelRef.current) return;
      const rect = anchor.getBoundingClientRect();
      const width = 230;
      const height = panelRef.current.offsetHeight;
      let top = rect.top - height - 12;
      if (top < 12) top = rect.bottom + 12;
      const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - width / 2),
        window.innerWidth - width - 12
      );
      setPos({ left, top });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [anchor, startISO, dueISO]);

  useLayoutEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, [pos]);

  if (!anchor || !pos) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: 230,
        zIndex: 2000,
      }}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-[#0f1524]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-1 gap-2">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Start
          </div>
          <DatePicker
            valueISO={startISO}
            onChangeISO={onChangeStart}
            placeholder="Start date"
          />
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Due
          </div>
          <DatePicker
            valueISO={dueISO}
            onChangeISO={onChangeDue}
            placeholder="Due date"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2 text-[12px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-200"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}


function SuccessBar({ percent }: { percent: number }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedWidth(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className="flex items-center w-full gap-2">

      <div className="flex-1 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-3 transition-all duration-1000 ease-in-out rounded-full bg-emerald-500"
          style={{ width: `${animatedWidth}%` }}
        />
      </div>

      <span className="min-w-[48px] text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100 text-right">
        {percent}%
      </span>
    </div>
  );
}



/* =================== table =================== */
type SortBy = "name" | "fav" | "success" | "author";
type SortDir = "asc" | "desc";

interface Props {
  pagedItems: Milestone[];
  stats: Record<number, { total: number; passed: number; passRate: number }>;
  favorites: Set<number>;
  selectedIds: Set<number>;
  setSelectedIds: (ids: Set<number>) => void;

  cols: { dates: boolean; success: boolean; author: boolean };
  sortBy: SortBy;
  sortDir: SortDir;

  toggleSelect: (id: number, v?: boolean) => void;
  toggleFavorite: (id: number) => void;

  startEdit: (m: Milestone) => void;
  saveEdit: (id: number) => void;
  cancelEdit: () => void;
  editingId: number | null;
  draftName: string;
  setDraftName: (s: string) => void;
  saving: boolean;

  deleteMilestone: (m: Milestone) => void;
  onUpdateDates: (id: number, start: string | null, due: string | null) => Promise<void> | void;

  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  setPage: (n: number | ((v: number) => number)) => void;
  setPageSize: (n: number) => void;

  setSortBy: (v: SortBy) => void;
  setSortDir: (v: SortDir) => void;

  needPad: boolean;
  colCount: number;
}

export default function MilestoneTable({
  pagedItems,
  stats,
  favorites,
  selectedIds,
  setSelectedIds,
  cols,
  sortBy,
  sortDir,
  toggleSelect,
  toggleFavorite,
  startEdit,
  saveEdit,
  cancelEdit,
  editingId,
  draftName,
  setDraftName,
  saving,
  deleteMilestone,
  onUpdateDates,
  page,
  pageSize,
  totalPages,
  totalItems,
  setPage,
  setPageSize,
  setSortBy,
  setSortDir,
  needPad,
  colCount,
}: Props) {
  const nav = useNavigate();
  const rowText = "text-sm";
  const headLabel =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300";
  const padX = "px-4";
  const padY = "py-3";
  const SELECT_ROW = "bg-green-50 dark:bg-white/10";

  const nextDir = (same: boolean): SortDir =>
    same ? (sortDir === "asc" ? "desc" : "asc") : "desc";
  const [editingDates, setEditingDates] = useState<{
    id: number;
    start: string | null;
    due: string | null;
    anchor: HTMLElement | null;
  } | null>(null);
  const [savingDatesId, setSavingDatesId] = useState<number | null>(null);
  const dateAnchors = useRef<Record<number, HTMLButtonElement | null>>({});

  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1524] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-[#0f1524]/90">
            <tr className={`${headLabel} text-left`}>
              {/* Select all */}
              <th className={`${padX} ${padY}`}>
                <TFCheckbox
                  title="Select all on page"
                  checked={
                    pagedItems.length > 0 &&
                    pagedItems.every((m) => selectedIds.has(m.id))
                  }
                  onChange={(v) => {
                    const ns = new Set(selectedIds);
                    pagedItems.forEach((m) =>
                      v ? ns.add(m.id) : ns.delete(m.id)
                    );
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
              <th className={`${padX} ${padY}`}>
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

              {/* Dates */}
              <th className={`${padX} ${padY} w-[160px]`}>
                {cols.dates ? (
                  "Dates"
                ) : (
                  <span className="invisible">Dates</span>
                )}
              </th>

              {/* Success */}
              <th className={`${padX} ${padY} w-[220px]`}>
                {cols.success ? (
                  <SortHeader
                    label="Success"
                    active={sortBy === "success"}
                    dir={sortDir}
                    onToggle={() => {
                      const same = sortBy === "success";
                      setSortBy("success");
                      setSortDir(nextDir(same));
                    }}
                  />
                ) : (
                  <span className="invisible">Success</span>
                )}
              </th>

              {/* Author */}
              <th className={`${padX} ${padY} w-[220px]`}>
                {cols.author ? (
                  <SortHeader
                    label="Author"
                    active={sortBy === "author"}
                    dir={sortDir}
                    onToggle={() => {
                      const same = sortBy === "author";
                      setSortBy("author");
                      setSortDir(nextDir(same));
                    }}
                  />
                ) : (
                  <span className="invisible">Author</span>
                )}
              </th>

              {/* Actions */}
              <th className={`${padX} ${padY} w-[160px] text-right`}>
                <span className={`${headLabel} inline-block text-right`}>
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody className={rowText}>
            {pagedItems.map((m) => {
              const selected = selectedIds.has(m.id);
              const favorite = favorites.has(m.id);
              const st = stats[m.id] || { total: 0, passed: 0, passRate: 0 };
              const percent = Math.round(st.passRate * 100);
              const isEditingDates = editingDates?.id === m.id;

              const handleSaveDates = async () => {
                if (!editingDates) return;
                setSavingDatesId(m.id);
                try {
                  await onUpdateDates(
                    m.id,
                    editingDates.start,
                    editingDates.due
                  );
                  setEditingDates(null);
                } finally {
                  setSavingDatesId(null);
                }
              };

              return (
                <RowHighlight
                  key={m.id}
                  selected={selected}
                  selectedClassName={SELECT_ROW}
                  hoverClassName=""
                  className="cursor-pointer transition"
                  onClick={() => {
                    if (editingId !== m.id) {
                      nav(`/projects/${m.projectId}/milestones/${m.id}`);
                    }
                  }}
                >
                  {/* Checkbox */}
                  <td className={`${padX} ${padY}`}>
                    <TFCheckbox
                      stop
                      checked={selected}
                      onChange={(v) => toggleSelect(m.id, v)}
                    />
                  </td>

                  {/* Fav */}
                  <td className={`${padX} ${padY}`}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-yellow-400 rounded-md h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(m.id);
                      }}
                    >
                      <StarIcon filled={favorite} size={16} />
                    </button>
                  </td>

                  {/* Name */}
                  <td className={`${padX} ${padY}`}>
                    <InlineEditCell
                      id={m.id}
                      value={m.name}
                      isEditing={editingId === m.id}
                      draft={draftName}
                      setDraft={setDraftName}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                      saving={saving}
                    />
                  </td>

                  {/* Dates */}
                  <td className={`${padX} ${padY}`}>
                    {cols.dates ? (
                      <div className="relative inline-flex items-center gap-3">
                        <button
                          ref={(el) => {
                            if (el) dateAnchors.current[m.id] = el;
                          }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDates({
                              id: m.id,
                              start: m.startDate ?? null,
                              due: m.dueDate ?? null,
                              anchor: dateAnchors.current[m.id] ?? e.currentTarget,
                            });
                          }}
                          className="group flex items-center gap-3 rounded-2xl border border-transparent px-2 py-1 text-left transition hover:border-emerald-200 hover:bg-emerald-50 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-900/20"
                        >
                          <DateBlock start={m.startDate} due={m.dueDate} />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500 opacity-0 transition group-hover:opacity-100">
                            Edit
                          </span>
                        </button>
                        {isEditingDates && (
                          <DateEditor
                            startISO={editingDates?.start ?? null}
                            dueISO={editingDates?.due ?? null}
                            onChangeStart={(iso) =>
                              setEditingDates((prev) =>
                                prev && prev.id === m.id
                                  ? { ...prev, start: iso }
                                  : prev
                              )
                            }
                            onChangeDue={(iso) =>
                              setEditingDates((prev) =>
                                prev && prev.id === m.id
                                  ? { ...prev, due: iso }
                                  : prev
                              )
                            }
                            onCancel={() => setEditingDates(null)}
                            onSave={handleSaveDates}
                            saving={savingDatesId === m.id}
                            anchor={editingDates?.anchor ?? dateAnchors.current[m.id] ?? null}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="invisible">placeholder</div>
                    )}
                  </td>

                  {/* Success */}
                  <td className={`${padX} ${padY}`}>
                    {cols.success ? (
                      st.total > 0 ? (
                        <SuccessBar percent={percent} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )
                    ) : (
                      <div className="invisible">placeholder</div>
                    )}
                  </td>

                  {/* Author */}
                  <td className={`${padX} ${padY}`}>
                    {cols.author ? (
                      <AuthorCell
                        name={m.createdByName}
                        email={m.createdByEmail}
                        userId={m.createdBy ?? 0}
                      />
                    ) : (
                      <div className="invisible">placeholder</div>
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
                          hidden: editingId === m.id,
                          onClick: () => {
                            nav(`/projects/${m.projectId}/milestones/${m.id}`);
                          },
                        },
                        {
                          key: "edit",
                          title: "Edit",
                          icon: <EditIcon />,
                          hidden: editingId === m.id,
                          onClick: () => startEdit(m),
                        },
                        {
                          key: "delete",
                          title: "Delete",
                          variant: "danger",
                          icon: <TrashIcon />,
                          onClick: () => deleteMilestone(m),
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
                  <div className="h-[450px]" />
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
