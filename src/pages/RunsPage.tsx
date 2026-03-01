// src/pages/RunsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Entities (new structure)
import {
  archiveRunsBulk,
  createRun,
  deleteRun,
  listRuns,
  listRunStatusCounts,
  updateRun,
} from "@/entities/test-run";
import type { Run } from "@/entities/test-run";
import { useConfirm, AlertBanner } from "@/shared/ui/alert";
import { RunsHeader, RunsLegend, RunsTable as RunTable, RunCreateForm } from "@/features/runs";

type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";
type RunStats = {
  total: number;
  counts: Record<StatusKey, number>;
  passRate: number;
};
type VisibleCols = { status: boolean; author: boolean };
const COLS_KEY = "runs.visibleCols";

export default function RunsPage() {
  const { id } = useParams();
  const projectId = Number(id ?? NaN);
  const nav = useNavigate();
  const confirmDlg = useConfirm();

  /* ----------------------- State ----------------------- */
  const [items, setItems] = useState<Run[]>([]);
  const [stats, setStats] = useState<Record<number, RunStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  /* --- Pagination --- */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  /* --- Columns --- */
  const [cols, setCols] = useState<VisibleCols>(() => {
    try {
      const raw = localStorage.getItem(COLS_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<VisibleCols>) : {};
      return { status: parsed.status ?? true, author: parsed.author ?? true };
    } catch {
      return { status: true, author: true };
    }
  });
  useEffect(() => {
    localStorage.setItem(COLS_KEY, JSON.stringify(cols));
  }, [cols]);

  /* --- Favorites --- */
  const FAV_KEY = `runs.favs.${projectId}`;
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set<number>(raw ? (JSON.parse(raw) as number[]) : []);
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      setFavorites(new Set<number>(raw ? (JSON.parse(raw) as number[]) : []));
    } catch {
      setFavorites(new Set());
    }
  }, [FAV_KEY]);
  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);
  const toggleFav = (rid: number) =>
    setFavorites((prev) => {
      const ns = new Set(prev);
      ns.has(rid) ? ns.delete(rid) : ns.add(rid);
      return ns;
    });

  /* --- Selection --- */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleSelect = (id: number, v?: boolean) => {
    setSelected((prev) => {
      const ns = new Set(prev);
      if (v ?? !prev.has(id)) ns.add(id);
      else ns.delete(id);
      return ns;
    });
  };

  /* --- Banner --- */
  const [banner, setBanner] = useState<{
    kind: "info" | "error" | "success" | "warning";
    text: string;
  } | null>(null);

  const notify = (
    kind: "info" | "error" | "success" | "warning",
    text: string,
    ms = 2400
  ) => {
    setBanner({ kind, text });
    if (ms) setTimeout(() => setBanner(null), ms);
  };

  /* --- Freeze Sort --- */
  const [freezeSort, setFreezeSort] = useState(false);

  /* --- Creation --- */
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  async function onCreate(name: string, description: string) {
    setCreating(true);
    try {
      const created = await createRun(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        closed: false,
      });
      setItems((prev) => [created, ...prev]);
      setCreateOpen(false);
      notify("success", "Run created");
    } catch (e: any) {
      notify("error", e?.response?.data?.message || "Create run failed");
    } finally {
      setCreating(false);
    }
  }

  /* --- Inline edit state --- */
  const [editForm, setEditForm] = useState<{
    id: number | null;
    name: string;
    description?: string;
  }>({
    id: null,
    name: "",
  });
  const [editing, setEditing] = useState(false);

  /* --- Deletion --- */
  const doDeleteRun = (run: Run) => {
    void (async () => {
      try {
        await deleteRun(run.id);
        setItems((prev) => prev.filter((r) => r.id !== run.id));
        notify("info", "Run deleted");
      } catch (e: any) {
        notify("error", e?.response?.data?.message || "Delete failed");
      }
    })();
  };

  /* --- Change status Open / Closed --- */
  const toggleClosed = async (runId: number, closed: boolean) => {
    try {
      const updated = await updateRun(runId, { closed });
      setItems((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      notify("success", closed ? "Run closed" : "Run reopened");
    } catch (e: any) {
      notify(
        "error",
        e?.response?.data?.message || "Failed to update run status"
      );
    }
  };

  /* --- Data loading --- */
  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0)
      nav("/projects", { replace: true });
  }, [projectId, nav]);

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const runs = await listRuns(projectId);
        if (alive) setItems(runs);
      } catch (e: any) {
        if (alive) setErr(e?.response?.data?.message || "Failed to load runs");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, nav]);

  /* --- Statistics --- */
  function idToKey(statusId: number): StatusKey {
    switch (statusId) {
      case 1:
        return "PASSED";
      case 2:
        return "RETEST";
      case 3:
        return "FAILED";
      case 4:
        return "SKIPPED";
      case 5:
        return "BROKEN";
      default:
        return "SKIPPED";
    }
  }

  const runIds = useMemo(() => items.map((r) => r.id).sort((a, b) => a - b), [items]);
  const runIdsKey = useMemo(() => runIds.join(","), [runIds]);

  useEffect(() => {
    if (!runIds.length) {
      setStats({});
      setStatsLoading(false);
      return;
    }
    let alive = true;
    setStatsLoading(true);
    (async () => {
      try {
        const rows = await listRunStatusCounts(projectId);
        if (!alive) return;

        const initial = Object.fromEntries(
          runIds.map((runId) => [
            runId,
            {
              total: 0,
              counts: {
                PASSED: 0,
                RETEST: 0,
                FAILED: 0,
                SKIPPED: 0,
                BROKEN: 0,
              },
              passRate: 0,
            } as RunStats,
          ])
        ) as Record<number, RunStats>;

        for (const row of rows) {
          const bucket = initial[row.runId];
          if (!bucket) continue;
          const key = idToKey(row.statusId);
          bucket.counts[key] += row.count;
          bucket.total += row.count;
        }

        for (const runId of Object.keys(initial)) {
          const stat = initial[Number(runId)];
          stat.passRate = stat.total ? stat.counts.PASSED / stat.total : 0;
        }

        setStats(initial);
      } catch {
        if (alive) {
          setStats(
            Object.fromEntries(
              runIds.map((runId) => [
                runId,
                {
                  total: 0,
                  counts: {
                    PASSED: 0,
                    RETEST: 0,
                    FAILED: 0,
                    SKIPPED: 0,
                    BROKEN: 0,
                  },
                  passRate: 0,
                } as RunStats,
              ])
            )
          );
        }
      } finally {
        if (alive) {
          setStatsLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, runIdsKey]);

  /* --- Filtering and sorting --- */
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((r) => (r.name || "").toLowerCase().includes(s));
  }, [items, q]);

  const [sortBy, setSortBy] = useState<"fav" | "name" | "status" | "author">(
    "name"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (freezeSort) return filtered;

    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortBy === "fav") {
        const af = favorites.has(a.id) ? 1 : 0;
        const bf = favorites.has(b.id) ? 1 : 0;
        if (af !== bf) return sortDir === "asc" ? af - bf : bf - af;
      }

      if (sortBy === "status") {
        const pa = stats[a.id]?.passRate ?? 0;
        const pb = stats[b.id]?.passRate ?? 0;
        if (pa !== pb) return sortDir === "asc" ? pa - pb : pb - pa;
      }

      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      if (an < bn) return sortDir === "asc" ? -1 : 1;
      if (an > bn) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filtered, favorites, stats, sortBy, sortDir, freezeSort]);

  const totalItems = sorted.length;
  const effectivePageSize = pageSize > 0 ? pageSize : Math.max(totalItems, 1);
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    if (pageSize === 0) return sorted;
    const start = (safePage - 1) * effectivePageSize;
    return sorted.slice(start, start + effectivePageSize);
  }, [sorted, pageSize, safePage, effectivePageSize]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const needPad = paged.length > 0 && paged.length < 8;

  /* ----------------------- Render ----------------------- */
  return (
    <div className="relative max-w-6xl px-4 py-8 mx-auto text-slate-900 dark:text-slate-100">
      {banner && (
        <div className="absolute left-0 right-0 top-0 z-50 flex justify-center">
          <div className="w-full max-w-xl px-4 drop-shadow-lg">
            <AlertBanner kind={banner.kind}>{banner.text}</AlertBanner>
          </div>
        </div>
      )}

      <RunsHeader
        totalItems={items.length}
        selectedCount={selected.size}
        onBulkDelete={() => {
          const ids = Array.from(selected);
          if (!ids.length) return;
          confirmDlg.open(`Delete ${ids.length} run(s)?`, async () => {
            try {
              await archiveRunsBulk(ids);
              const selectedSet = new Set(ids);
              setItems((prev) => prev.filter((r) => !selectedSet.has(r.id)));
              setSelected(new Set());
              notify("info", `Deleted ${ids.length} run(s)`);
            } catch (e: any) {
              notify("error", e?.response?.data?.message || "Bulk delete failed");
            }
          });
        }}
        onNewRun={() => setCreateOpen(true)}
        cols={cols}
        setCols={setCols}
        q={q}
        onSearch={setQ}
      />

      <RunsLegend />

      <RunTable
        projectId={projectId}
        items={sorted}
        pagedItems={paged}
        stats={stats}
        statsLoading={statsLoading}
        favorites={favorites}
        selectedIds={selected}
        setSelectedIds={setSelected}
        cols={cols}
        sortBy={sortBy}
        sortDir={sortDir}
        setSortBy={setSortBy}
        setSortDir={setSortDir}
        loading={loading}
        err={err}
        toggleSelect={toggleSelect}
        toggleFavorite={toggleFav}
        doDeleteRun={doDeleteRun}
        toggleClosed={toggleClosed}
        confirmDlg={confirmDlg}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        setPage={setPage}
        setPageSize={setPageSize}
        freezeSort={freezeSort}
        setFreezeSort={setFreezeSort}
        needPad={needPad}
        colCount={6}
        editingRunId={editForm.id}
        draftRunName={editForm.name}
        setDraftRunName={(s) => setEditForm((prev) => ({ ...prev, name: s }))}
        startEditRun={(r) => setEditForm({ id: r.id, name: r.name })}
        cancelEditRun={() => setEditForm({ id: null, name: "" })}
        saveEditRun={async (id: number) => {
          if (!editForm.name.trim()) return;
          setEditing(true);
          try {
            const updated = await updateRun(id, {
              name: editForm.name.trim(),
              description: (editForm.description ?? "").trim() || undefined,
            });

            setItems((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
            setEditForm({ id: null, name: "" });

            notify("success", "Run renamed");
          } catch (e: any) {
            notify("error", e?.response?.data?.message || "Rename failed");
          } finally {
            setEditing(false);
          }
        }}
        savingRun={editing}
      />

      {isCreateOpen && (
        <RunCreateForm
          onClose={() => setCreateOpen(false)}
          onCreate={onCreate}
          creating={creating}
        />
      )}

      {confirmDlg.ui}
    </div>
  );
}
