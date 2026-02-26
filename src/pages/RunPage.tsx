// src/pages/RunPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { http } from "@/lib/http";

// Entities (new structure)
import type { Run, RunCase } from "@/entities/test-run";
import {
  addCasesToRun as addCasesToRunApi,
  listRunCases,
  getRun,
} from "@/entities/test-run";
import { listCases, updateCase as apiUpdateCase } from "@/entities/test-case";
import type { TestCase } from "@/entities/test-case";

// Entities (new structure)
import { addResult } from "@/entities/test-result";
import { STATUS_ID } from "@/entities/test-result";

import { useConfirm, AlertBanner } from "@/shared/ui/alert";
import SearchInput from "@/shared/ui/search/SearchInput";
import {
  RunTable,
  RunTableVisibleCols as VisibleCols,
  AddToRunModal,
  RunToolbar,
} from "@/features/runs";

/* ---------- icons ---------- */
function IconBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- statuses ---------- */
type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";
const ID_TO_KEY = (id: number | null): StatusKey => {
  if (id == null) return "SKIPPED";
  const entry = (Object.keys(STATUS_ID) as StatusKey[]).find(
    (k) => STATUS_ID[k] === id
  );
  return (entry || "SKIPPED") as StatusKey;
};

/* ---------- local ---------- */
type Suite = { id: number; name: string; description?: string | null };

type GroupSummary = {
  id: number;
  name: string;
  personal: boolean;
  ownerId: number;
  ownerEmail: string;
  membersCount: number;
};

const COLS_KEY = "run.visibleCols.v4";
const HIDE_SUITES_KEY = "run.hideSuites";

/* ---------- alerts & confirm ---------- */
type BannerKind = "info" | "error" | "success" | "warning";

export default function RunPage() {
  const { id, runId } = useParams();
  const projectId = Number(id ?? NaN);
  const rid = Number(runId ?? NaN);
  const nav = useNavigate();
  const location = useLocation();

  const state = (location.state || {}) as any;
  const milestoneIdFromState = state?.milestoneId;
  const milestoneIdFromQuery = new URLSearchParams(location.search).get(
    "milestoneId"
  );
  const backMilestoneId =
    (typeof milestoneIdFromState === "number" ? milestoneIdFromState : null) ??
    (milestoneIdFromQuery ? Number(milestoneIdFromQuery) : null);

  const backHref = backMilestoneId
    ? `/projects/${projectId}/milestones/${backMilestoneId}`
    : `/projects/${projectId}/runs`;
  const backLabel = backMilestoneId ? "Back to milestone" : "Back to runs";

  const confirm = useConfirm();
  const [banner, setBanner] = useState<{ kind: BannerKind; text: string } | null>(
    null
  );
  const notify = (kind: BannerKind, text: string, ms = 2400) => {
    setBanner({ kind, text });
    if (ms) setTimeout(() => setBanner(null), ms);
  };

  const [run, setRun] = useState<Run | null>(null);
  const [runCases, setRunCases] = useState<RunCase[]>([]);
  const [casesMap, setCasesMap] = useState<Record<number, TestCase>>({});
  const [allCases, setAllCases] = useState<TestCase[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const defaultCols: VisibleCols = {
    status: true,
    type: true,
    priority: true,
    automation: true,
    author: true,
    jira: true,
  };

  const [cols, setCols] = useState<VisibleCols>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COLS_KEY) || "{}") || {};
      if ("meta" in saved) delete (saved as any).meta;
      return { ...defaultCols, ...saved };
    } catch {
      return defaultCols;
    }
  });
  useEffect(() => {
    localStorage.setItem(COLS_KEY, JSON.stringify(cols));
  }, [cols]);

  const [hideSuites, setHideSuites] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(HIDE_SUITES_KEY) || "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    localStorage.setItem(HIDE_SUITES_KEY, JSON.stringify(hideSuites));
  }, [hideSuites]);

  const patchCaseMeta = async (
    caseId: number,
    patch: Partial<Pick<TestCase, "typeId" | "priorityId" | "automationStatus">>
  ) => {
    const previous = casesMap[caseId];
    if (!previous) return;
    setCasesMap((map) => ({
      ...map,
      [caseId]: { ...map[caseId], ...patch },
    }));
    try {
      await apiUpdateCase(caseId, patch as any);
    } catch (e: any) {
      setCasesMap((map) => ({
        ...map,
        [caseId]: previous,
      }));
      notify("error", e?.response?.data?.message || "Failed to update case");
    }
  };

  /* ---------- Load Run, Cases, Suites, Groups ---------- */
  useEffect(() => {
    if (!Number.isFinite(projectId) || !Number.isFinite(rid)) {
      nav(`/projects/${projectId}/runs`, { replace: true });
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [runRes, rc, allCasesRes, suitesRes, groupsRes] = await Promise.all([
          getRun(rid),
          listRunCases(rid),
          listCases(projectId, { size: 0 }),
          http
            .get<Suite[]>(`/api/projects/${projectId}/suites`)
            .then((r) => r.data)
            .catch(() => []),
          http
            .get<GroupSummary[]>(`/api/groups/my`)
            .then((r) => r.data)
            .catch(() => []),
        ]);
        if (!alive) return;

        setRun(runRes);
        setRunCases(rc);

        const arr = (allCasesRes as TestCase[]) || [];
        setAllCases(arr);
        setCasesMap(Object.fromEntries(arr.map((c) => [c.id, c])));
        setSuites(suitesRes);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load run");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, rid, nav]);

  /* ---------- Aggregations ---------- */
  const runCasesFiltered = useMemo(
    () => runCases.filter((rc) => !!casesMap[rc.caseId]),
    [runCases, casesMap]
  );

  /* ---------- Pagination ---------- */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const totalItems = runCasesFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedRunCases = useMemo(() => {
    const start = (page - 1) * pageSize;
    return runCasesFiltered.slice(start, start + pageSize);
  }, [runCasesFiltered, page, pageSize]);

  /* ---------- Add & Remove ---------- */
  const [showAdd, setShowAdd] = useState(false);
  async function addCasesToRun(caseIds: number[]) {
    const existing = new Set(runCases.map((rc) => rc.caseId));
    const unique = caseIds.filter((id) => !existing.has(id));
    if (!unique.length) return;
    await addCasesToRunApi(rid, unique);
    const fresh = await listRunCases(rid);
    setRunCases(fresh);
    notify("success", `Added ${unique.length} case(s)`);
  }

  const [picked, setPicked] = useState<Set<number>>(new Set());
  const pickedCount = picked.size;

  function togglePickCase(caseId: number, checked: boolean) {
    setPicked((prev) => {
      const n = new Set(prev);
      checked ? n.add(caseId) : n.delete(caseId);
      return n;
    });
  }

  function togglePickSuite(items: RunCase[], checked: boolean) {
    setPicked((prev) => {
      const n = new Set(prev);
      for (const rc of items) checked ? n.add(rc.caseId) : n.delete(rc.caseId);
      return n;
    });
  }

  function askRemoveCase(caseId: number, title?: string) {
    confirm.open(
      `Remove "${title || `Case #${caseId}`}" from this run?`,
      async () => {
        try {
          await http.delete(`/api/runs/${rid}/cases/${caseId}`);
          setRunCases((prev) => prev.filter((x) => x.caseId !== caseId));
          notify("info", "Case removed");
        } catch (e: any) {
          notify("error", e?.response?.data?.message || "Failed");
        }
      }
    );
  }

  function removePicked() {
    if (pickedCount === 0) return;
    const ids = Array.from(picked);
    confirm.open(`Remove ${ids.length} case(s)?`, async () => {
      try {
        await Promise.all(
          ids.map((cid) =>
            http.delete(`/api/runs/${rid}/cases/${cid}`).catch(() => {})
          )
        );
        const fresh = await listRunCases(rid);
        setRunCases(fresh);
        setPicked(new Set());
        notify("info", `Removed ${ids.length} case(s)`);
      } catch {
        notify("warning", "Removed with partial errors");
      }
    });
  }

  /* ---------- Filtering & Grouping ---------- */
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    let arr = [...runCasesFiltered];
    if (q.trim()) {
      const s = q.toLowerCase().trim();
      arr = arr.filter((r) =>
        (casesMap[r.caseId]?.title || "").toLowerCase().includes(s)
      );
    }
    arr.sort((a, b) =>
      (casesMap[a.caseId]?.title || "").localeCompare(
        casesMap[b.caseId]?.title || ""
      )
    );
    return arr;
  }, [runCasesFiltered, q, casesMap]);

  const groups = useMemo(() => {
    if (hideSuites)
      return [{ id: null as number | null, name: "All cases", items: filtered }];
    const bySuite = new Map<number | null, RunCase[]>();
    for (const rc of filtered) {
      const sid = casesMap[rc.caseId]?.suiteId ?? null;
      if (!bySuite.has(sid)) bySuite.set(sid, []);
      bySuite.get(sid)!.push(rc);
    }
    return Array.from(bySuite.entries())
      .map(([sid, items]) => ({
        id: sid,
        name: sid
          ? suites.find((s) => s.id === sid)?.name || `Suite #${sid}`
          : "No suite",
        items,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, casesMap, suites, hideSuites]);

  const tableColCount =
    3 +
    (cols.type ? 1 : 0) +
    (cols.priority ? 1 : 0) +
    (cols.automation ? 1 : 0) +
    (cols.author ? 1 : 0) +
    (cols.jira ? 1 : 0) +
    (cols.status ? 1 : 0);

  /* ---------- Render ---------- */
  return (
    <div className="relative max-w-6xl px-4 py-8 pb-24 mx-auto">
      {banner && (
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-center">
          <div className="w-full max-w-xl px-4 drop-shadow-lg">
            <AlertBanner kind={banner.kind}>{banner.text}</AlertBanner>
          </div>
        </div>
      )}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-[240px]">
          <button
            onClick={() => nav(backHref)}
            className="inline-flex items-center gap-1 mb-1 text-xs text-slate-500 hover:underline dark:text-slate-400"
          >
            <IconBack /> {backLabel}
          </button>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {run?.name || "Run"}
            <span className="ml-2 border rounded-2xl border-slate-300 px-2 py-0.5 text-[10px] text-slate-500 dark:border-slate-700">
              Run ID {rid}
            </span>
          </h1>
          {run?.description && (
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {run.description}
            </p>
          )}
        </div>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 mt-2 mb-3">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search in run cases…"
          className="flex-1 min-w-[220px] sm:max-w-xs"
        />

        <RunToolbar
          hideSuites={hideSuites}
          onToggleHideSuites={setHideSuites}
          cols={cols}
          onChangeCols={setCols}
          pickedCount={pickedCount}
          onRemovePicked={removePicked}
          onClickAddCases={() => setShowAdd(true)}
        />
      </section>

      <RunTable
        projectId={projectId}
        runId={rid}
        groups={groups}
        casesMap={casesMap}
        cols={cols}
        setCols={setCols}
        groupBySuite={!hideSuites}
        picked={picked}
        onTogglePickCase={togglePickCase}
        onTogglePickSuite={togglePickSuite}
        askRemoveCase={askRemoveCase}
        setCaseStatus={(rc, id) => {
          setRunCases((prev) =>
            prev.map((r) =>
              r.caseId === rc.caseId ? { ...r, currentStatusId: id } : r
            )
          );
          addResult(rid, rc.caseId, { statusId: id }).catch(() =>
            setRunCases((prev) =>
              prev.map((r) =>
                r.caseId === rc.caseId
                  ? { ...r, currentStatusId: rc.currentStatusId }
                  : r
              )
            )
          );
        }}
        onPatchCaseMeta={patchCaseMeta}
        loading={loading}
        tableColCount={tableColCount}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        setPage={setPage}
        setPageSize={setPageSize}
      />

      {showAdd && (
        <AddToRunModal
          onClose={() => setShowAdd(false)}
          onAddCases={(ids) => {
            setShowAdd(false);
            addCasesToRun(ids);
          }}
          suites={suites}
          allCases={allCases}
          alreadyInRun={new Set(runCasesFiltered.map((r) => r.caseId))}
        />
      )}

      {confirm.ui}
    </div>
  );
}
