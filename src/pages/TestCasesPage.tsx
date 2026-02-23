// src/pages/TestCasesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "@/lib/http";

// Entities (new structure)
import { listAllProjects } from "@/entities/project";
import type { Project } from "@/entities/project";
import type { TestCase } from "@/entities/test-case";
import {
  updateCase as apiUpdateCase,
  deleteCase as apiDeleteCase,
} from "@/entities/test-case";
import { updateSuite as apiUpdateSuite } from "@/entities/test-suite";
import { useConfirm, AlertBanner } from "@/shared/ui/alert";
import { FolderIcon } from "@/shared/ui/icons";
import { TestCasesHeader, CaseSuiteCard, ImportExportPanel, type CaseRowsListProps, CreateSuiteModal, type Suite } from "@/features/test-cases";

/* fixed grid: [title] + Priority + Type + Automation + Author + [actions] */
const GRID_TMPL =
  "grid grid-cols-[minmax(0,1fr)_110px_140px_140px_220px_128px] gap-2";

/* localStorage keys */
const COLS_KEY = "cases.columns";
const SUITE_SORT_DIR_KEY = "cases.suiteSortDir";
const CASE_SORT_DIR_KEY = "cases.caseSortDir";
const CASE_SORT_PER_SUITE_KEY = "cases.caseSortPerSuite";

/* columns config */
type ColKey = "priority" | "type" | "automation" | "author";
const DEFAULT_COLS: Record<ColKey, boolean> = {
  priority: true,
  type: true,
  automation: true,
  author: true,
};

export default function TestCasesPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const projectId = Number(id ?? NaN);

  const confirm = useConfirm();
  const [banner, setBanner] = useState<{
    kind: "error" | "info";
    text: string;
  } | null>(null);
  function alertMsg(text: string, kind: "error" | "info" = "error") {
    setBanner({ kind, text });
    setTimeout(() => setBanner(null), 2600);
  }

  const [project, setProject] = useState<Project | null>(null);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [openSuites, setOpenSuites] = useState<Record<string, boolean>>({
    project: false,
  });

  const [cols, setCols] = useState<Record<ColKey, boolean>>(() => {
    try {
      return {
        ...DEFAULT_COLS,
        ...JSON.parse(localStorage.getItem(COLS_KEY) || "{}"),
      };
    } catch {
      return DEFAULT_COLS;
    }
  });
  useEffect(() => {
    localStorage.setItem(COLS_KEY, JSON.stringify(cols));
  }, [cols]);

  const [suiteSortDir, setSuiteSortDir] = useState<"asc" | "desc">(
    (localStorage.getItem(SUITE_SORT_DIR_KEY) as any) || "asc"
  );
  useEffect(
    () => localStorage.setItem(SUITE_SORT_DIR_KEY, suiteSortDir),
    [suiteSortDir]
  );

  const [defaultCaseSortDir, setDefaultCaseSortDir] = useState<"asc" | "desc">(
    (localStorage.getItem(CASE_SORT_DIR_KEY) as any) || "asc"
  );
  useEffect(
    () => localStorage.setItem(CASE_SORT_DIR_KEY, defaultCaseSortDir),
    [defaultCaseSortDir]
  );

  const [caseSortPerSuite, setCaseSortPerSuite] = useState<
    Record<string, "asc" | "desc">
  >(() => {
    try {
      return JSON.parse(localStorage.getItem(CASE_SORT_PER_SUITE_KEY) || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem(
      CASE_SORT_PER_SUITE_KEY,
      JSON.stringify(caseSortPerSuite)
    );
  }, [caseSortPerSuite]);

  const [editingSuiteId, setEditingSuiteId] = useState<number | null>(null);
  const [editSuiteName, setEditSuiteName] = useState("");
  const [busyRename, setBusyRename] = useState(false);

  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [draftCaseTitle, setDraftCaseTitle] = useState("");

  const [showSuiteModal, setShowSuiteModal] = useState(false);
  const [q, setQ] = useState("");
  const [selectedSuites, setSelectedSuites] = useState<Set<number>>(new Set());
  const [selectedCases, setSelectedCases] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0)
      nav("/projects", { replace: true });
  }, [projectId, nav]);

  /* ========== LOAD PROJECT, SUITES, CASES ========== */
  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const all = await listAllProjects();
      const p = all.find((x) => x.id === projectId) || null;
      if (!p) {
        nav("/projects", { replace: true });
        return;
      }
      setProject(p);

      const [suitesRes, casesRes] = await Promise.all([
        http.get<Suite[]>(`/api/projects/${projectId}/suites`),
        http.get<TestCase[]>(`/api/projects/${projectId}/cases`),
      ]);

      setSuites(suitesRes.data);
      setCases(casesRes.data);

      // expand new suites
      setOpenSuites((prev) => {
        const m: Record<string, boolean> = { ...prev };
        for (const s of suitesRes.data) if (!(s.id in m)) m[s.id] = true;
        return m;
      });
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) return;
    loadData();
  }, [projectId]);

  /* ========== SORTING, GROUPING ========== */
  const suitesSorted = useMemo(() => {
    const arr = [...suites];
    arr.sort((a, b) => {
      const an = a.name.toLowerCase();
      const bn = b.name.toLowerCase();
      if (an < bn) return suiteSortDir === "asc" ? -1 : 1;
      if (an > bn) return suiteSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [suites, suiteSortDir]);

  const grouped = useMemo(() => {
    const s = q.trim().toLowerCase();
    const map = new Map<string, TestCase[]>();
    for (const c of cases) {
      if (s && !(c.title || "").toLowerCase().includes(s)) continue;
      const key = c.suiteId ? String(c.suiteId) : "project";
      const arr = map.get(key);
      if (arr) arr.push(c);
      else map.set(key, [c]);
    }
    for (const [k, list] of map) {
      const dir = caseSortPerSuite[k] || defaultCaseSortDir;
      list.sort((a, b) => {
        const an = (a.title || "").toLowerCase();
        const bn = (b.title || "").toLowerCase();
        if (an < bn) return dir === "asc" ? -1 : 1;
        if (an > bn) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    if (!map.has("project")) map.set("project", []);
    return map;
  }, [cases, caseSortPerSuite, defaultCaseSortDir, q]);

  const suitesToRender = useMemo(() => {
    const s = q.trim();
    if (!s) return suitesSorted;
    return suitesSorted.filter(
      (su) => (grouped.get(String(su.id))?.length || 0) > 0
    );
  }, [suitesSorted, grouped, q]);

  /* ========== CASE + SUITE OPERATIONS ========== */
  const goNewCase = (suiteId?: number) => {
    const qs = suiteId ? `?suiteId=${encodeURIComponent(String(suiteId))}` : "";
    nav(`/projects/${projectId}/cases/new${qs}`);
  };
  const openCasePage = (caseId: number) =>
    nav(`/projects/${projectId}/cases/${caseId}`);

  const moveCase = async (caseId: number, targetSuite: number | null) => {
    const cur = cases.find((c) => c.id === caseId);
    if (!cur) return;
    const prevSuite = cur.suiteId ?? null;
    if (prevSuite === targetSuite) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? ({ ...c, suiteId: targetSuite ?? undefined } as TestCase)
          : c
      )
    );
    try {
      await apiUpdateCase(caseId, { suiteId: targetSuite });
    } catch (e: any) {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? ({ ...c, suiteId: prevSuite ?? undefined } as TestCase)
            : c
        )
      );
      alertMsg(e?.response?.data?.message || "Failed to move case");
    }
  };

  const startRenameSuite = (s: Suite) => {
    setEditingSuiteId(s.id);
    setEditSuiteName(s.name);
  };
  const cancelRename = () => {
    setEditingSuiteId(null);
    setEditSuiteName("");
  };
  const saveRename = async (id?: number) => {
    if (!editingSuiteId) return;
    const newName = editSuiteName.trim();
    if (!newName || suites.find((s) => s.id === id)?.name === newName) {
      cancelRename();
      return;
    }
    setBusyRename(true);
    try {
      const updated = await apiUpdateSuite(editingSuiteId, { name: newName });
      setSuites((prev) =>
        prev.map((s) => (s.id === editingSuiteId ? { ...s, ...updated } : s))
      );
      cancelRename();
    } catch (e: any) {
      alertMsg(e?.response?.data?.message || "Failed to rename suite");
    } finally {
      setBusyRename(false);
    }
  };

  const startEditCaseTitle = (c: TestCase) => {
    setEditingCaseId(c.id);
    setDraftCaseTitle(c.title || "");
  };
  const cancelEditCaseTitle = () => {
    setEditingCaseId(null);
    setDraftCaseTitle("");
  };
  const saveCaseTitle = async (id: number) => {
    const title = draftCaseTitle.trim();
    if (!title) {
      cancelEditCaseTitle();
      return;
    }
    try {
      const updated = await apiUpdateCase(id, { title });
      setCases((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...updated } : x))
      );
      cancelEditCaseTitle();
    } catch (e: any) {
      alertMsg(e?.response?.data?.message || "Failed to update title");
    }
  };

  const patchCase = async (
    id: number,
    patch: Partial<
      Pick<TestCase, "priorityId" | "typeId" | "automationStatus" | "title">
    >
  ) => {
    const prev = cases.find((x) => x.id === id);
    if (!prev) return;
    setCases((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      await apiUpdateCase(id, patch as any);
    } catch (e: any) {
      setCases((list) => list.map((x) => (x.id === id ? prev : x)));
      alertMsg(e?.response?.data?.message || "Failed to update case");
    }
  };

  const deleteSingleCase = (id: number) => {
    const c = cases.find((x) => x.id === id);
    confirm.open(
      `Delete case �${c?.title || `#${id}`}�? This cannot be undone.`,
      async () => {
        try {
          await apiDeleteCase(id);
          setCases((prev) => prev.filter((x) => x.id !== id));
          setSelectedCases((prev) => {
            const ns = new Set(prev);
            ns.delete(id);
            return ns;
          });
        } catch (e: any) {
          alertMsg(e?.response?.data?.message || "Delete failed");
        }
      }
    );
  };

  /* ========== SELECTION + BULK ========== */
  const toggleSuiteCheckbox = (suiteKey: string, v: boolean) => {
    const ids = grouped.get(suiteKey) ?? [];
    setSelectedCases((prev) => {
      const ns = new Set(prev);
      ids.forEach((c) => (v ? ns.add(c.id) : ns.delete(c.id)));
      return ns;
    });
    if (suiteKey !== "project") {
      const sid = Number(suiteKey);
      setSelectedSuites((prev) => {
        const ns = new Set(prev);
        if (v) ns.add(sid);
        else ns.delete(sid);
        return ns;
      });
    }
  };

  const toggleCaseCheckbox = (caseId: number, v: boolean) => {
    setSelectedCases((prev) => {
      const ns = new Set(prev);
      if (v) ns.add(caseId);
      else ns.delete(caseId);
      return ns;
    });
  };

  const toggleSuiteOpen = (key: string) =>
    setOpenSuites((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSuiteSortDirection = (key: string) =>
    setCaseSortPerSuite((prev) => ({
      ...prev,
      [key]: (prev[key] || defaultCaseSortDir) === "asc" ? "desc" : "asc",
    }));

  const bulkDelete = async () => {
    const suiteIds = Array.from(selectedSuites);
    const caseIds = Array.from(selectedCases);
    if (!suiteIds.length && !caseIds.length) return;

    const sTxt = suiteIds.length ? `${suiteIds.length} suite(s)` : "";
    const cTxt = caseIds.length ? `${caseIds.length} case(s)` : "";
    const parts = [sTxt, cTxt].filter(Boolean).join(" and ");

    confirm.open(`Delete ${parts}? This cannot be undone.`, async () => {
      for (const sid of suiteIds) {
        try {
          await http.delete(`/api/suites/${sid}`);
          setSuites((prev) => prev.filter((s) => s.id !== sid));
        } catch (e: any) {
          alertMsg(e?.response?.data?.message || `Failed to delete suite #${sid}`);
        }
      }
      for (const cid of caseIds) {
        try {
          await apiDeleteCase(cid);
          setCases((prev) => prev.filter((c) => c.id !== cid));
        } catch (e: any) {
          alertMsg(e?.response?.data?.message || `Failed to delete case #${cid}`);
        }
      }
      setSelectedSuites(new Set());
      setSelectedCases(new Set());
    });
  };

  /* ========== DND ========== */
  const allowDrop = (zoneKey: string) => (e: React.DragEvent) => e.preventDefault();
  const dropTo = (targetKey: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    const idNum = Number(idStr);
    const targetSuiteId = targetKey === "project" ? null : Number(targetKey);
    moveCase(idNum, targetSuiteId);
  };

  /* ========== RENDER ========== */
  const projectCases = grouped.get("project") ?? [];
  const projectSortDir = caseSortPerSuite["project"] || defaultCaseSortDir;

  const caseRowsProps: Omit<CaseRowsListProps, "cases" | "cols" | "gridTemplate"> = {
    selectedCases,
    onToggleCase: toggleCaseCheckbox,
    onOpenCase: openCasePage,
    onStartEditCase: startEditCaseTitle,
    onCancelEditCase: cancelEditCaseTitle,
    onSaveCaseTitle: saveCaseTitle,
    onDeleteCase: deleteSingleCase,
    onPatchCase: patchCase,
    editingCaseId,
    draftCaseTitle,
    setDraftCaseTitle,
  };

  if (!Number.isFinite(projectId) || projectId <= 0) return null;

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      {banner && (
        <div className="transition-all duration-300 animate-fade-in">
          <AlertBanner kind={banner.kind} className="mb-4 shadow-md">
            {banner.text}
          </AlertBanner>
        </div>
      )}

      {/* Header */}
      <TestCasesHeader
        q={q}
        onSearch={setQ}
        cols={cols}
        setCols={setCols}
        selectedSuites={selectedSuites}
        selectedCases={selectedCases}
        onBulkDelete={bulkDelete}
        onNewSuite={() => setShowSuiteModal(true)}
        extraRight={
          <ImportExportPanel
            projectId={projectId}
            onAlert={alertMsg}
            onImported={loadData} // ? update after import
          />
        }
      />

      {err && (
        <AlertBanner kind="error" className="mb-6">
          {err}
        </AlertBanner>
      )}

      {/* ======= Hierarchy ======= */}
      <section className="space-y-4">
        {!q.trim() && (
          <CaseSuiteCard
            suiteKey="project"
            title="No suite"
            icon={<FolderIcon className="text-slate-600 dark:text-slate-300" />}
            description={`${projectCases.length} case(s)`}
            open={!!openSuites.project}
            onToggle={() => toggleSuiteOpen("project")}
            onAddCase={() => goNewCase()}
            sortDir={projectSortDir}
            onToggleSort={() => toggleSuiteSortDirection("project")}
            onDragOver={allowDrop("project")}
            onDrop={dropTo("project")}
            cols={cols}
            cases={projectCases}
            gridTemplate={GRID_TMPL}
            suiteSelectable={false}
            suiteChecked={false}
            suiteIndeterminate={false}
            onSuiteCheck={() => {}}
            renameControls={null}
            {...caseRowsProps}
          />
        )}

        {suitesToRender.map((suite) => {
          const suiteKey = String(suite.id);
          const suiteCases = grouped.get(suiteKey) ?? [];
          const open = !!openSuites[suiteKey];
          const suiteSortDir = caseSortPerSuite[suiteKey] || defaultCaseSortDir;
          const totalSelected = suiteCases.filter((c) => selectedCases.has(c.id)).length;
          const suiteChecked = selectedSuites.has(suite.id);
          const suiteIndeterminate =
            suiteCases.length > 0 && totalSelected > 0 && totalSelected < suiteCases.length;
          const isRenamingSuite = editingSuiteId === suite.id;

          return (
            <CaseSuiteCard
              key={suiteKey}
              suiteKey={suiteKey}
              title={suite.name}
              icon={<FolderIcon className="text-slate-700 dark:text-slate-300" />}
              description={`${suiteCases.length} case(s)`}
              open={open}
              onToggle={() => toggleSuiteOpen(suiteKey)}
              onAddCase={() => goNewCase(suite.id)}
              sortDir={suiteSortDir}
              onToggleSort={() => toggleSuiteSortDirection(suiteKey)}
              onDragOver={allowDrop(suiteKey)}
              onDrop={dropTo(suiteKey)}
              cols={cols}
              cases={suiteCases}
              gridTemplate={GRID_TMPL}
              suiteSelectable
              suiteChecked={suiteChecked}
              suiteIndeterminate={suiteIndeterminate && !suiteChecked}
              onSuiteCheck={(checked) => toggleSuiteCheckbox(suiteKey, checked)}
              renameControls={{
                showRename: !isRenamingSuite,
                onStartRename: () => startRenameSuite(suite),
                isRenaming: isRenamingSuite,
                renameName: editSuiteName,
                setRenameName: setEditSuiteName,
                onSaveRename: saveRename,
                onCancelRename: cancelRename,
              }}
              {...caseRowsProps}
            />
          );
        })}
      </section>

      {/* Create Suite */}
      {showSuiteModal && (
        <CreateSuiteModal
          projectId={projectId}
          onClose={() => setShowSuiteModal(false)}
          onCreated={(s) => {
            setSuites((prev) => [s, ...prev]);
            setOpenSuites((o) => ({ ...o, [s.id]: true }));
          }}
        />
      )}

      {confirm.ui}
    </div>
  );
}
