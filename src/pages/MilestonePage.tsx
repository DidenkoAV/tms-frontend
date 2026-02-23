// src/pages/MilestonePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Entities (new structure)
import {
  getMilestone,
  listMilestoneRuns,
  addRunsToMilestone,
  removeRunFromMilestone,
} from "@/entities/milestone";
import { listRuns, listRunCases } from "@/entities/test-run";
import type { Milestone } from "@/entities/milestone";
import type { Run, RunCase } from "@/entities/test-run";
import { STATUS_ID } from "@/entities/test-result";

/* shared ui */
import { useConfirm, AlertBanner } from "@/shared/ui/alert";
import SearchInput from "@/shared/ui/search/SearchInput";
import TableHeaderActions from "@/shared/ui/table/TableHeaderActions";

/* components */
import { MilestoneDashboard, MilestoneRunsTable, AddRunModal } from "@/features/milestone";

/* ---------- status helpers ---------- */
type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";

const ID_TO_KEY = (id: number | null): StatusKey => {
  if (id == null) return "SKIPPED";
  const entry = (Object.keys(STATUS_ID) as StatusKey[]).find((k) => STATUS_ID[k] === id);
  return (entry || "SKIPPED") as StatusKey;
};

type StatusCounts = Record<StatusKey, number>;
const emptyCounts: StatusCounts = { PASSED: 0, RETEST: 0, FAILED: 0, SKIPPED: 0, BROKEN: 0 };

/* ---------- columns prefs ---------- */
type VisibleCols = { breakdown: boolean; author: boolean };
const COLS_KEY = "milestone.runs.visibleCols";

/* ---------- type guard ---------- */
function hasValidId(r: Run): r is Run & { id: number } {
  return r.id !== null && r.id !== undefined;
}

/* ---------- page ---------- */
export default function MilestonePage() {
  const { id, milestoneId } = useParams();
  const projectId = Number(id ?? NaN);
  const mid = Number(milestoneId ?? NaN);
  const nav = useNavigate();
  const confirm = useConfirm();

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [projectRuns, setProjectRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [runStats, setRunStats] = useState<Record<number, { counts: StatusCounts; total: number; passRate: number }>>({});
  const [runStatsLoading, setRunStatsLoading] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  /* pagination */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* sorting and favorites */
  const [sortBy, setSortBy] = useState<"name" | "fav">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const ns = new Set(prev);
      if (ns.has(id)) ns.delete(id);
      else ns.add(id);
      return ns;
    });
  };

  /* multi-select */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* columns + search */
  const defaultCols: VisibleCols = { breakdown: true, author: true };
  const [cols, setCols] = useState<VisibleCols>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(COLS_KEY) || "{}") ?? {};
      const breakdown =
        typeof stored.breakdown === "boolean"
          ? stored.breakdown
          : typeof stored.cases === "boolean"
          ? stored.cases
          : defaultCols.breakdown;
      const author =
        typeof stored.author === "boolean" ? stored.author : defaultCols.author;
      return { breakdown, author };
    } catch {
      return defaultCols;
    }
  });
  useEffect(() => {
    localStorage.setItem(COLS_KEY, JSON.stringify(cols));
  }, [cols]);

  const [q, setQ] = useState("");

  /* load base data */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [m, inMs, allRuns] = await Promise.all([
          getMilestone(mid),
          listMilestoneRuns(mid),
          listRuns(projectId).catch(() => [] as any),
        ]);
        if (!alive) return;
        setMilestone(m);
        setRuns(inMs as any);
        setProjectRuns(allRuns as any);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load milestone");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId, mid]);

  /* per-run stats */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!runs.length) {
        if (!cancelled) {
          setRunStats({});
          setRunStatsLoading(false);
        }
        return;
      }
      if (!cancelled) setRunStatsLoading(true);
      const validRuns = runs.filter(hasValidId);
      const pairs: Array<[number, { counts: StatusCounts; total: number; passRate: number }]> = [];

      for (const r of validRuns) {
        const runId: number = r.id;
        try {
          const rc = await listRunCases(runId);
          const counts: StatusCounts = { ...emptyCounts };
          for (const row of rc as RunCase[]) {
            const key = ID_TO_KEY(row.currentStatusId ?? null);
            counts[key] += 1;
          }
          const total = (rc as RunCase[]).length;
          const passRate = total ? counts.PASSED / total : 0;
          pairs.push([runId, { counts, total, passRate }]);
        } catch {
          pairs.push([runId, { counts: { ...emptyCounts }, total: 0, passRate: 0 }]);
        }
      }
      if (!cancelled) {
        setRunStats(Object.fromEntries(pairs));
        setRunStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runs]);

  /* aggregate */
  const overall = useMemo(() => {
    const counts: StatusCounts = { ...emptyCounts };
    let total = 0;
    for (const r of runs.filter(hasValidId)) {
      const st = runStats[r.id];
      if (!st) continue;
      total += st.total;
      (Object.keys(counts) as StatusKey[]).forEach((k) => { counts[k] += st.counts[k]; });
    }
    const passRate = total ? counts.PASSED / total : 0;
    return { counts, total, passRate };
  }, [runs, runStats]);

  const availableRuns = useMemo(() => {
    const already = new Set(runs.filter(hasValidId).map((r) => r.id));
    return projectRuns.filter(hasValidId).filter((r) => !already.has(r.id) && !r.archived);
  }, [projectRuns, runs]);

  /* ---------- ACTIONS ---------- */
  async function addPicked() {
    if (!picked.length) return;
    try {
      const updated = await addRunsToMilestone(mid, picked);
      setRuns(updated as any);
      setPicked([]);
      setShowAdd(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to add runs");
    }
  }

  function askRemoveRun(runId: number) {
    confirm.open("Remove this run from milestone?", async () => {
      try {
        await removeRunFromMilestone(mid, runId);
        setRuns((prev) => prev.filter((r) => r.id !== runId));
      } catch (e: any) {
        alert(e?.response?.data?.message || "Failed to remove run");
      }
    });
  }

  function askRemoveSelected() {
    if (!selectedIds.size) return;
    confirm.open(`Remove ${selectedIds.size} runs from milestone?`, async () => {
      try {
        for (const rid of selectedIds) {
          await removeRunFromMilestone(mid, rid);
        }
        setRuns((prev) => prev.filter((r) => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
      } catch (e: any) {
        alert(e?.response?.data?.message || "Failed to remove selected runs");
      }
    });
  }

  /* search filter */
  const filteredRuns = useMemo(() => {
    return runs.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [runs, q]);

  /* sorting */
  const sortedRuns = useMemo(() => {
    const arr = [...filteredRuns];
    arr.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return sortDir === "asc"
            ? (a.name || "").localeCompare(b.name || "")
            : (b.name || "").localeCompare(a.name || "");
        case "fav": {
          const favA = favorites.has(a.id) ? 1 : 0;
          const favB = favorites.has(b.id) ? 1 : 0;
          return sortDir === "asc" ? favA - favB : favB - favA;
        }
        default:
          return 0;
      }
    });
    return arr;
  }, [filteredRuns, sortBy, sortDir, runStats, favorites]);

  /* pagination logic */
  const totalItems = sortedRuns.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedRuns = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRuns.slice(start, start + pageSize);
  }, [sortedRuns, page, pageSize]);

  const needPad = pagedRuns.length < pageSize;

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      {err && <AlertBanner kind="error" className="mb-4">{err}</AlertBanner>}

      {/* Header */}
      <header className="mb-6">
        <button
          onClick={() => nav(`/projects/${projectId}/milestones`)}
          className="inline-flex items-center gap-1 mb-1 text-xs text-slate-500 hover:underline dark:text-slate-400"
        >
          ? Back to milestones
        </button>
        <h1 className="text-3xl font-semibold">{milestone?.name || "Milestone"}</h1>
      </header>

      {/* Dashboard */}
      <section className="mb-6">
        <MilestoneDashboard counts={overall.counts} total={overall.total} />
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search runs"
          className="w-72"
          storageKey={`milestone.runs.search.${mid}`}
          ariaLabel="Search runs"
        />

        <TableHeaderActions
          selectedCount={selectedIds.size}
          onBulkDelete={askRemoveSelected}
          onToggleCreate={() => setShowAdd(true)}
          showCreate={true}
          createLabel="New Run"
          cols={cols}
          setCols={(v) => setCols(v as VisibleCols)}
          items={[
            { key: "breakdown", label: "Breakdown" },
            { key: "author", label: "Author" },
          ]}
          deleteVariant="icon"
          buttonSize="sm"
        />
      </section>

      {/* Runs table */}
      <MilestoneRunsTable
        projectId={projectId}
        milestoneId={mid}
        runs={pagedRuns}
        runStats={runStats}
        runStatsLoading={runStatsLoading}
        cols={cols}
        loading={loading}
        askRemoveRun={askRemoveRun}
        dynamicColspan={4 + (cols.breakdown ? 1 : 0) + (cols.author ? 1 : 0)}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        setPage={setPage}
        setPageSize={setPageSize}
        sortBy={sortBy}
        sortDir={sortDir}
        setSortBy={setSortBy}
        setSortDir={setSortDir}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        needPad={needPad}
        colCount={4 + (cols.breakdown ? 1 : 0) + (cols.author ? 1 : 0)}
      />

      {/* Add-run modal */}
      {showAdd && (
        <AddRunModal
          onClose={() => setShowAdd(false)}
          runs={availableRuns}
          picked={picked}
          setPicked={setPicked}
          onAdd={addPicked}
        />
      )}

      {confirm.ui}
    </div>
  );
}
