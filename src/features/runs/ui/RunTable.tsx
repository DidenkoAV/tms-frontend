// src/features/runs/components/RunTable.tsx
import { Fragment, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TFCheckbox } from "@/shared/ui/table";
import { TrashIcon } from "@/shared/ui/icons";
import { MiniStatusBar } from "@/shared/ui/reports";
import AuthorCell from "@/shared/ui/table/AuthorCell";
import JiraIssuesInline from "@/features/integrations/jira/ui/JiraIssuesInline";
import RunStatusPicker from "@/shared/ui/table/RunStatusPicker";
import Pagination from "@/shared/ui/pagination/Pagination";
import { AlertBanner } from "@/shared/ui/alert";
import TableHeaderActions from "@/shared/ui/table/TableHeaderActions";
import { SortHeader } from "@/shared/ui/table/ColumnSortButton";
import RowHighlight from "@/shared/ui/table/RowHighlight";
import { DropdownPortal, MenuItem } from "@/features/test-cases";
import {
  CasePriorityBadge,
  CaseTypeBadge,
  CaseAutomationBadge,
  automationLabelFromStatus,
  priorityLabelFromId,
  typeLabelFromId,
} from "@/shared/ui/table/CaseBadges";

import type { RunCase } from "@/entities/test-run";
import type { TestCase } from "@/entities/test-case";

type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";

export type VisibleCols = {
  status: boolean;
  type: boolean;
  priority: boolean;
  automation: boolean;
  author: boolean;
  jira: boolean;
};

type SuiteGroup = {
  id: number | null;
  name: string;
  items: RunCase[];
};

const TYPE_OPTIONS = [
  { id: 1, label: "Functional" },
  { id: 2, label: "Regression" },
  { id: 3, label: "Smoke" },
  { id: 4, label: "Security" },
  { id: 5, label: "Performance" },
  { id: 6, label: "Other" },
];

const PRIORITY_OPTIONS = [
  { id: 1, label: "Low" },
  { id: 2, label: "Medium" },
  { id: 3, label: "High" },
  { id: 4, label: "Critical" },
];

const AUTOMATION_OPTIONS = [
  { key: "AUTOMATED", label: "Automated" },
  { key: "IN_PROGRESS", label: "WIP" },
  { key: "NOT_AUTOMATED", label: "Manual" },
];

type PatchFn = (
  caseId: number,
  patch: Partial<Pick<TestCase, "typeId" | "priorityId" | "automationStatus">>
) => void;

function TypeControl({
  caseId,
  valueId,
  onPatch,
}: {
  caseId: number;
  valueId?: number | null;
  onPatch: PatchFn;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const label = typeLabelFromId(valueId);
  return (
    <div className="flex items-center">
      <CaseTypeBadge
        ref={ref}
        type={label}
        interactive
        showCaret
        onClick={() => setOpen((v) => !v)}
        title="Change type"
      />
      <DropdownPortal
        open={open}
        anchor={ref.current}
        onClose={() => setOpen(false)}
        width={220}
      >
        {TYPE_OPTIONS.map((opt) => (
          <MenuItem
            key={opt.id}
            active={valueId === opt.id}
            label={opt.label}
            onClick={() => {
              setOpen(false);
              onPatch(caseId, { typeId: opt.id });
            }}
          />
        ))}
      </DropdownPortal>
    </div>
  );
}

function PriorityControl({
  caseId,
  valueId,
  onPatch,
}: {
  caseId: number;
  valueId?: number | null;
  onPatch: PatchFn;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const label = priorityLabelFromId(valueId);
  return (
    <div className="flex items-center">
      <CasePriorityBadge
        ref={ref}
        priority={label}
        interactive
        showCaret
        onClick={() => setOpen((v) => !v)}
        title="Change priority"
      />
      <DropdownPortal
        open={open}
        anchor={ref.current}
        onClose={() => setOpen(false)}
        width={220}
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <MenuItem
            key={opt.id}
            active={valueId === opt.id}
            label={opt.label}
            onClick={() => {
              setOpen(false);
              onPatch(caseId, { priorityId: opt.id });
            }}
          />
        ))}
      </DropdownPortal>
    </div>
  );
}

function AutomationControl({
  caseId,
  value,
  onPatch,
}: {
  caseId: number;
  value?: string | null;
  onPatch: PatchFn;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const label = automationLabelFromStatus(value);
  return (
    <div className="flex items-center">
      <CaseAutomationBadge
        ref={ref}
        automation={label}
        interactive
        showCaret
        onClick={() => setOpen((v) => !v)}
        title="Change automation"
      />
      <DropdownPortal
        open={open}
        anchor={ref.current}
        onClose={() => setOpen(false)}
        width={220}
      >
        {AUTOMATION_OPTIONS.map((opt) => (
          <MenuItem
            key={opt.key}
            active={value === opt.key}
            label={opt.label}
            onClick={() => {
              setOpen(false);
              onPatch(caseId, { automationStatus: opt.key as any });
            }}
          />
        ))}
      </DropdownPortal>
    </div>
  );
}

interface Props {
  projectId: number;
  runId: number;
  groups: SuiteGroup[];
  casesMap: Record<number, TestCase>;
  cols: VisibleCols;
  setCols: (v: VisibleCols) => void;
  groupBySuite: boolean;
  picked: Set<number>;
  onTogglePickCase: (id: number, checked: boolean) => void;
  onTogglePickSuite: (items: RunCase[], checked: boolean) => void;
  askRemoveCase: (caseId: number, title?: string) => void;
  setCaseStatus: (rc: RunCase, statusId: number) => void;
  onPatchCaseMeta: (
    caseId: number,
    patch: Partial<Pick<TestCase, "typeId" | "priorityId" | "automationStatus">>
  ) => void;
  onBulkDelete?: () => void;
  onAddCase?: () => void;
  loading: boolean;
  tableColCount: number;

  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  setPage: (v: number | ((p: number) => number)) => void;
  setPageSize: (v: number) => void;

  banner?: { kind: "error" | "info"; text: string } | null;
}

export default function RunTable({
  projectId,
  runId,
  groups,
  casesMap,
  cols,
  setCols,
  groupBySuite,
  picked,
  onTogglePickCase,
  onTogglePickSuite,
    askRemoveCase,
    setCaseStatus,
    onPatchCaseMeta,
  onBulkDelete,
  onAddCase,
  loading,
  tableColCount,
  page,
  pageSize,
  totalItems,
  totalPages,
  setPage,
  setPageSize,
  banner,
}: Props) {
  const [collapsed, setCollapsed] = useState<Record<number | string, boolean>>({});
  const [sortBy, setSortBy] = useState("case");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();

  const CHECK_CELL = "w-[44px] px-3 py-2";
  const headLabel =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300";
  const SELECT_ROW = "bg-emerald-50/80 dark:bg-white/10";

  const allCases = groups.flatMap((g) => g.items);
  const allSelected =
    allCases.length > 0 && allCases.every((r) => picked.has(r.caseId));
  const someSelected =
    allCases.some((r) => picked.has(r.caseId)) && !allSelected;

  const sortedGroups = !groupBySuite
    ? groups.map((g) => ({
        ...g,
        items: [...g.items].sort((a, b) => {
          const ca = casesMap[a.caseId];
          const cb = casesMap[b.caseId];
          const dir = sortDir === "asc" ? 1 : -1;
          if (sortBy === "case")
            return (ca?.title ?? "").localeCompare(cb?.title ?? "") * dir;
          if (sortBy === "priority")
            return ((ca?.priorityId ?? 0) - (cb?.priorityId ?? 0)) * dir;
          if (sortBy === "type")
            return ((ca?.typeId ?? 0) - (cb?.typeId ?? 0)) * dir;
          return 0;
        }),
      }))
    : groups;

  const handleSort = (key: string) => {
    if (!groupBySuite) {
      if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortBy(key);
        setSortDir("asc");
      }
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1524] overflow-hidden mt-3">
      {banner && <AlertBanner kind={banner.kind}>{banner.text}</AlertBanner>}

      <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-sm border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-[#0f1524]/90">
            <tr className={`${headLabel} text-left`}>
              <th className={CHECK_CELL}>
                <TFCheckbox
                  title="Select all"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(v) =>
                    allCases.forEach((r) => onTogglePickCase(r.caseId, v))
                  }
                />
              </th>

              <th
                className={`px-3 py-3 ${
                  !groupBySuite ? "cursor-pointer" : "select-none"
                }`}
                onClick={() => !groupBySuite && handleSort("case")}
              >
                {!groupBySuite ? (
                  <SortHeader
                    label="Case"
                    active={sortBy === "case"}
                    dir={sortDir}
                  />
                ) : (
                  <span className={headLabel}>Case</span>
                )}
              </th>

              {cols.type && (
                <th
                  className={`px-3 py-3 w-28 ${
                    !groupBySuite ? "cursor-pointer" : "select-none"
                  }`}
                  onClick={() => !groupBySuite && handleSort("type")}
                >
                  {!groupBySuite ? (
                    <SortHeader
                      label="Type"
                      active={sortBy === "type"}
                      dir={sortDir}
                    />
                  ) : (
                    <span className={headLabel}>Type</span>
                  )}
                </th>
              )}

              {cols.priority && (
                <th
                  className={`px-3 py-3 w-28 ${
                    !groupBySuite ? "cursor-pointer" : "select-none"
                  }`}
                  onClick={() => !groupBySuite && handleSort("priority")}
                >
                  {!groupBySuite ? (
                    <SortHeader
                      label="Priority"
                      active={sortBy === "priority"}
                      dir={sortDir}
                    />
                  ) : (
                    <span className={headLabel}>Priority</span>
                  )}
                </th>
              )}
              {cols.automation && (
                <th className="px-3 py-3 w-32">
                  <span className={headLabel}>Automation</span>
                </th>
              )}

              {cols.author && (
                <th className="w-48 px-3 py-3">
                  <span className={headLabel}>Author</span>
                </th>
              )}
              {cols.jira && (
                <th className="px-3 py-3 w-44">
                  <span className={headLabel}>Bugs</span>
                </th>
              )}
              {cols.status && (
                <th className="w-48 px-3 py-3">
                  <span className={headLabel}>Status</span>
                </th>
              )}
              <th className="w-[80px] px-3 py-3 text-center">
                <span className={`${headLabel} inline-block`}>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={tableColCount}
                  className="px-3 py-5 text-center text-slate-500"
                >
                  Loading…
                </td>
              </tr>
            ) : (
              <>
                {sortedGroups.map((group) => {
                  const key = group.id ?? `g-${group.name}`;
                  const isCollapsed = collapsed[key];
                  const total = group.items.length;

                  const counts = {
                    PASSED: 0,
                    RETEST: 0,
                    FAILED: 0,
                    SKIPPED: 0,
                    BROKEN: 0,
                  } as Record<StatusKey, number>;

                  for (const rc of group.items) {
                    switch (rc.currentStatusId) {
                      case 1:
                        counts.PASSED++;
                        break;
                      case 2:
                        counts.RETEST++;
                        break;
                      case 3:
                        counts.FAILED++;
                        break;
                      case 4:
                        counts.SKIPPED++;
                        break;
                      case 5:
                        counts.BROKEN++;
                        break;
                    }
                  }

                  return (
                    <Fragment key={key}>
                      {groupBySuite && (
                        <tr className="border-t bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700">
                          <td className={CHECK_CELL}>
                            <button
                              onClick={() =>
                                setCollapsed((prev) => ({
                                  ...prev,
                                  [key]: !prev[key],
                                }))
                              }
                              className="text-slate-500 dark:text-slate-400"
                            >
                              {isCollapsed ? "▶" : "▼"}
                            </button>
                          </td>
                          <td colSpan={tableColCount - 1} className="px-3 py-2">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md border bg-white text-slate-600 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600">
                                Suite
                              </span>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {group.name}
                              </div>
                              <MiniStatusBar counts={counts as any} total={total} />
                            </div>
                          </td>
                        </tr>
                      )}

                      {!isCollapsed &&
                        group.items.map((rc) => {
                          const tc = casesMap[rc.caseId];
                          const selected = picked.has(rc.caseId);
                          return (
                            <RowHighlight
                              key={rc.id}
                              selected={selected}
                              selectedClassName={SELECT_ROW}
                              hoverClassName=""
                              className="transition-colors cursor-pointer"
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (
                                  target.closest("button") ||
                                  target.closest("input") ||
                                  target.closest("a")
                                )
                                  return;
                                if (tc)
                                  navigate(
                                    `/projects/${projectId}/cases/${tc.id}?runId=${runId}`,
                                    { state: { fromRun: true, runId } }
                                  );
                              }}
                            >
                              <td className={CHECK_CELL + " align-middle"}>
                                <TFCheckbox
                                  stop
                                  checked={selected}
                                  onChange={(v) => onTogglePickCase(rc.caseId, v)}
                                />
                              </td>
                              <td className="px-3 py-2">
                                {tc ? (
                                  <span
                                    className="inline-block max-w-xs truncate text-[14px] leading-[1.15] 
                                    font-normal tracking-tight font-display
                                     text-slate-900 dark:text-slate-200"
                                  >
                                    {tc.title}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">
                                    Case #{rc.caseId}
                                  </span>
                                )}
                              </td>
                              {cols.type && (
                                <td className="px-3 py-2">
                                  {tc ? (
                                    <TypeControl
                                      caseId={tc.id}
                                      valueId={tc.typeId}
                                      onPatch={onPatchCaseMeta}
                                    />
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              )}
                              {cols.priority && (
                                <td className="px-3 py-2">
                                  {tc ? (
                                    <PriorityControl
                                      caseId={tc.id}
                                      valueId={tc.priorityId}
                                      onPatch={onPatchCaseMeta}
                                    />
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              )}
                              {cols.automation && (
                                <td className="px-3 py-2">
                                  {tc ? (
                                    <AutomationControl
                                      caseId={tc.id}
                                      value={tc.automationStatus}
                                      onPatch={onPatchCaseMeta}
                                    />
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              )}
                              {cols.author && (
                                <td className="px-3 py-2">
                                  <AuthorCell
                                    name={(tc as any)?.createdByName}
                                    email={(tc as any)?.createdByEmail}
                                    userId={(tc as any)?.createdBy ?? 0}
                                  />
                                </td>
                              )}
                              {cols.jira && (
                                <td className="px-3 py-2">
                                  <JiraIssuesInline
                                    groupId={0}
                                    testCaseId={rc.caseId}
                                  />
                                </td>
                              )}
                              {cols.status && (
                                <td className="px-3 py-2">
                                  <RunStatusPicker
                                    valueId={rc.currentStatusId}
                                    onChange={(newId: number) =>
                                      setCaseStatus(rc, newId)
                                    }
                                  />
                                </td>
                              )}
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() =>
                                    askRemoveCase(rc.caseId, tc?.title)
                                  }
                                  className="inline-flex items-center justify-center w-8 h-8 transition-colors border rounded-lg border-rose-200 text-rose-400 dark:border-slate-700 dark:text-slate-300 hover:bg-rose-50/50 dark:hover:bg-rose-900/20"
                                  type="button"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </RowHighlight>
                          );
                        })}
                    </Fragment>
                  );
                })}

                {Array.from({
                  length: Math.max(0, 12 - allCases.length),
                }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td colSpan={tableColCount} className="h-[38px]"></td>
                  </tr>
                ))}
              </>
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
        className="text-sm"
      />
    </section>
  );
}
