// src/pages/MilestonesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Entities (new structure)
import {
  listMilestones,
  listMilestoneRuns,
  updateMilestone,
  archiveMilestone,
} from "@/entities/milestone";
import type { Milestone } from "@/entities/milestone";
import { listRunCases } from "@/entities/test-run";
import type { RunCase } from "@/entities/test-run";
import { STATUS_ID } from "@/entities/test-result";
import { useConfirm, AlertBanner } from "@/shared/ui/alert";

/* components */
import { MilestoneCreateForm, MilestonesHeader, MilestonesTable as MilestoneTable } from "@/features/milestones";

/* ================= helpers & types ================= */
type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";
const ID_TO_KEY = (id: number): StatusKey => {
  const entry = (Object.keys(STATUS_ID) as StatusKey[]).find(
    (k) => STATUS_ID[k] === id
  );
  return (entry || "SKIPPED") as StatusKey;
};
const emptyCounts: Record<StatusKey, number> = {
  PASSED: 0,
  RETEST: 0,
  FAILED: 0,
  SKIPPED: 0,
  BROKEN: 0,
};
type MsStats = {
  counts: Record<StatusKey, number>;
  total: number;
  passRate: number;
};
type SortBy = "name" | "fav" | "success" | "author";

/* ================= page ================= */
export default function MilestonesPage() {
  const { id } = useParams();
  const projectId = Number(id ?? NaN);
  const nav = useNavigate();
  const confirm = useConfirm();

  const [items, setItems] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<Record<number, MsStats>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [banner, setBanner] = useState<{
    kind: "info" | "error";
    text: string;
  } | null>(null);
  const notify = (kind: "info" | "error", text: string, ms = 2400) => {
    setBanner({ kind, text });
    if (ms) setTimeout(() => setBanner(null), ms);
  };

  // UI state
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [cols, setCols] = useState({
    dates: true,
    success: true,
    author: true,
  });

  // inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (m: Milestone) => {
    setEditingId(m.id);
    setDraftName(m.name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraftName("");
  };
  const saveEdit = async (id: number) => {
    if (!draftName.trim()) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMilestone(id, {
        name: draftName.trim(),
      });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      notify("info", "Milestone renamed");
      cancelEdit();
    } catch (e: any) {
      notify(
        "error",
        e?.response?.data?.message || "Failed to rename milestone"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateDates = async (
    id: number,
    startDate: string | null,
    dueDate: string | null
  ) => {
    try {
      const updated = await updateMilestone(id, {
        startDate: startDate ?? null,
        dueDate: dueDate ?? null,
      });
      setItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
      notify("info", "Dates updated");
    } catch (e: any) {
      notify(
        "error",
        e?.response?.data?.message || "Failed to update milestone dates"
      );
    }
  };

  /* -------- load milestones -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await listMilestones(projectId);
        if (!alive) return;
        setItems(data);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load milestones");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);

  /* -------- load stats -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!items.length) {
        setStats({});
        return;
      }

      const entries: Array<[number, MsStats]> = [];
      for (const m of items) {
        try {
          const runs = await listMilestoneRuns(m.id);
          const counts: Record<StatusKey, number> = { ...emptyCounts };
          let total = 0;
          for (const r of runs as any[]) {
            const rc = await listRunCases(r.id);
            for (const row of rc as RunCase[]) {
              if (row.currentStatusId != null) {
                counts[ID_TO_KEY(row.currentStatusId)]++;
              }
            }
            total += (rc as RunCase[]).length;
          }
          entries.push([
            m.id,
            { counts, total, passRate: total ? counts.PASSED / total : 0 },
          ]);
        } catch {
          entries.push([
            m.id,
            { counts: { ...emptyCounts }, total: 0, passRate: 0 },
          ]);
        }
      }
      if (!cancelled) setStats(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  /* -------- filter + sort -------- */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) => m.name?.toLowerCase().includes(s));
  }, [items, q]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      if (sortBy === "success") {
        const sa = stats[a.id]?.passRate ?? 0;
        const sb = stats[b.id]?.passRate ?? 0;
        return (sa - sb) * dir;
      }
      if (sortBy === "fav") {
        const fa = favorites.has(a.id);
        const fb = favorites.has(b.id);
        if (fa !== fb) return (fa ? -1 : 1) * dir;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [filtered, sortBy, sortDir, stats, favorites]);

  const tableStats = useMemo(
    () =>
      Object.fromEntries(
        items.map((m) => {
          const s = stats[m.id];
          return [
            m.id,
            {
              total: s?.total ?? 0,
              passed: s?.counts.PASSED ?? 0,
              passRate: s?.passRate ?? 0,
            },
          ];
        })
      ),
    [items, stats]
  );

  /* ================= render ================= */
  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      {banner && (
        <AlertBanner kind={banner.kind} className="mb-4">
          {banner.text}
        </AlertBanner>
      )}

      <MilestonesHeader
        selectedCount={selectedIds.size}
        onBulkDelete={() => {
          const ids = Array.from(selectedIds);
          if (!ids.length) return;
          confirm.open(`Delete ${ids.length} milestones?`, async () => {
            await Promise.all(
              ids.map((mid) => archiveMilestone(mid).catch(() => {}))
            );
            setItems((prev) => prev.filter((m) => !selectedIds.has(m.id)));
            setSelectedIds(new Set());
            notify("info", "Deleted selected milestones");
          });
        }}
        onNewMilestone={() => setShowCreate(true)}
        q={q}
        onSearch={setQ}
        cols={cols}
        setCols={setCols}
      />

      <MilestoneTable
        pagedItems={sorted}
        stats={tableStats}
        favorites={favorites}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        cols={cols}
        sortBy={sortBy}
        sortDir={sortDir}
        setSortBy={setSortBy}
        setSortDir={setSortDir}
        toggleSelect={(id, v) => {
          setSelectedIds((prev) => {
            const ns = new Set(prev);
            const on = v ?? !ns.has(id);
            on ? ns.add(id) : ns.delete(id);
            return ns;
          });
        }}
        toggleFavorite={(id) => {
          setFavorites((prev) => {
            const ns = new Set(prev);
            ns.has(id) ? ns.delete(id) : ns.add(id);
            return ns;
          });
        }}
        startEdit={startEdit}
        saveEdit={saveEdit}
        cancelEdit={cancelEdit}
        editingId={editingId}
        draftName={draftName}
        setDraftName={setDraftName}
        saving={saving}
        deleteMilestone={(m) =>
          confirm.open(`Delete milestone "${m.name}"?`, async () => {
            try {
              await archiveMilestone(m.id);
              setItems((prev) => prev.filter((x) => x.id !== m.id));
              notify("info", "Milestone deleted");
            } catch (e: any) {
              notify(
                "error",
                e?.response?.data?.message || "Failed to delete milestone"
              );
            }
          })
        }
        onUpdateDates={updateDates}
        page={1}
        pageSize={20}
        totalPages={1}
        totalItems={items.length}
        setPage={() => {}}
        setPageSize={() => {}}
        needPad={items.length < 10}
        colCount={6}
      />

      {/* Create */}
      {showCreate && (
        <MilestoneCreateForm
          projectId={projectId}
          onCreated={(created) => {
            setItems((prev) => [...prev, created]);
            setShowCreate(false);
            notify("info", "Milestone created");
            nav(`/projects/${projectId}/milestones/${created.id}`);
          }}
          onClose={() => setShowCreate(false)}
          onError={(msg) => notify("error", msg)}
        />
      )}

      {err && (
        <AlertBanner kind="error" className="mt-4">
          {err}
        </AlertBanner>
      )}
      {confirm.ui}
    </div>
  );
}
