// src/pages/TestCasesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { http } from "@/lib/http";

// Entities (new structure)
import { listAllProjects } from "@/entities/project";
import type { Project } from "@/entities/project";
import type { TestCase } from "@/entities/test-case";
import {
  updateCase as apiUpdateCase,
  deleteCase as apiDeleteCase,
} from "@/entities/test-case";
import { updateSuite as apiUpdateSuite, batchDeleteSuites } from "@/entities/test-suite";
import { getGroupMembers } from "@/entities/group";
import type { GroupMemberSimple } from "@/entities/group";
import { useConfirm, AlertBanner } from "@/shared/ui/alert";
import { FolderIcon } from "@/shared/ui/icons";
import { TestCasesHeader, CaseSuiteCard, ImportExportPanel, type CaseRowsListProps, CreateSuiteModal, type Suite } from "@/features/test-cases";
import { JiraBatchProvider, useJiraBatch } from "@/features/integrations/jira/ui/JiraBatchContext";
import { useMe } from "@/features/account";

/* Dynamic grid template based on visible columns */
function buildGridTemplate(cols: Record<ColKey, boolean>): string {
  const parts: string[] = ["minmax(200px,1fr)"]; // Title column - more space for full names

  if (cols.priority) parts.push("90px");   // Compact: 100 → 90
  if (cols.type) parts.push("100px");      // Compact: 120 → 100
  if (cols.automation) parts.push("90px"); // Compact: 110 → 90
  if (cols.author) parts.push("110px");    // Compact: 120 → 110
  if (cols.assigned) parts.push("140px");  // Wider for dropdown: 120 → 140
  if (cols.jira) parts.push("160px");      // Wider for multiple tickets + actions: 140 → 160

  parts.push("80px"); // Actions column - more compact: 96 → 80

  // Return CSS value for gridTemplateColumns, not className
  return parts.join(" ");
}

/* localStorage keys */
const COLS_KEY = "cases.columns";
const SUITE_SORT_DIR_KEY = "cases.suiteSortDir";
const CASE_SORT_DIR_KEY = "cases.caseSortDir";
const CASE_SORT_PER_SUITE_KEY = "cases.caseSortPerSuite";

/* columns config */
type ColKey = "priority" | "type" | "automation" | "author" | "assigned" | "jira";
const DEFAULT_COLS: Record<ColKey, boolean> = {
  priority: true,
  type: true,
  automation: true,
  author: true,
  assigned: true, // Assigned to
  jira: true, // Enabled by default - uses batch loading for performance
};

// Inner component that uses JiraBatch context
function TestCasesPageContent() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const projectId = Number(id ?? NaN);
  const jiraBatch = useJiraBatch();

  const confirm = useConfirm();
  const [banner, setBanner] = useState<{
    kind: "error" | "info";
    text: string;
  } | null>(null);
  function alertMsg(text: string, kind: "error" | "info" = "error") {
    setBanner({ kind, text });
    setTimeout(() => setBanner(null), 2600);
  }

  const { me } = useMe();
  const groupId = me?.currentGroupId ?? me?.groups?.[0]?.id ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMemberSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Counter to force remount of CaseRow components when data is reloaded
  // This ensures JiraIssuesInline reloads fresh data
  const [dataVersion, setDataVersion] = useState(0);

  const [openSuites, setOpenSuites] = useState<Record<string, boolean>>({
    project: false,
  });

  const [cols, setCols] = useState<Record<ColKey, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COLS_KEY) || "{}");
      // Ensure all default columns exist (migration for new columns like 'jira')
      // If 'jira' is missing, add it with default value
      const merged = {
        ...DEFAULT_COLS,
        ...saved,
      };
      // If jira was not in saved config, ensure it's set to default
      if (!('jira' in saved)) {
        merged.jira = DEFAULT_COLS.jira;
      }
      return merged;
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
  const [parentSuiteForNew, setParentSuiteForNew] = useState<number | null>(null);
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

      // Load group members for assignee dropdown
      if (groupId) {
        try {
          const members = await getGroupMembers(groupId);
          console.log("=== ASSIGNEE FILTERING DEBUG ===");
          console.log("Project:", p.name);
          console.log("Project groupPersonal:", p.groupPersonal);
          console.log("Current user ID:", me?.id);
          console.log("All members:", members);

          // Filter only ACTIVE members
          let activeMembers = members.filter(m => m.status === "ACTIVE");
          console.log("Active members:", activeMembers);

          // If project belongs to a personal group, only show current user
          if (p.groupPersonal && me?.id) {
            console.log("Filtering for personal group - keeping only user", me.id);
            activeMembers = activeMembers.filter(m => m.userId === me.id);
          }

          console.log("Final members for assignee:", activeMembers);
          setGroupMembers(activeMembers);
        } catch (e) {
          console.warn("Failed to load group members:", e);
          setGroupMembers([]);
        }
      }

      // expand new suites
      setOpenSuites((prev) => {
        const m: Record<string, boolean> = { ...prev };
        for (const s of suitesRes.data) if (!(s.id in m)) m[s.id] = true;
        return m;
      });

      // Load Jira issues for all cases in batch (if Jira column is visible)
      if (cols.jira && casesRes.data.length > 0) {
        const caseIds = casesRes.data.map(c => c.id);
        await jiraBatch.loadBatch(projectId, caseIds);
      }

      // Increment version to force remount of CaseRow components
      // This ensures JiraIssuesInline reloads fresh data
      setDataVersion(v => v + 1);
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

  // Reload data when returning to this page (e.g., after navigating back from case details)
  // location.key changes on every navigation, so we reload data
  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) return;
    loadData();
  }, [location.key]);

  /* ========== SORTING, GROUPING ========== */
  const suitesSorted = useMemo(() => {
    // No automatic sorting - keep server order
    // Only sort by depth to ensure parent suites come before children
    const arr = [...suites];
    arr.sort((a, b) => a.depth - b.depth);
    return arr;
  }, [suites]);

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
    // No automatic sorting - keep server order
    if (!map.has("project")) map.set("project", []);
    return map;
  }, [cases, q]);

  // Build suite hierarchy: only root suites (depth 0 or no parent)
  const rootSuites = useMemo(() => {
    return suitesSorted.filter(s => !s.parentId || s.depth === 0);
  }, [suitesSorted]);

  // Get children for a suite
  const getChildSuites = (parentId: number): Suite[] => {
    return suitesSorted.filter(s => s.parentId === parentId);
  };

  const suitesToRender = useMemo(() => {
    const s = q.trim();
    if (!s) return rootSuites;
    return rootSuites.filter(
      (su) => (grouped.get(String(su.id))?.length || 0) > 0
    );
  }, [rootSuites, grouped, q]);

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
      Pick<TestCase, "priorityId" | "typeId" | "automationStatus" | "title" | "assignedTo">
    >
  ) => {
    const prev = cases.find((x) => x.id === id);
    if (!prev) return;
    setCases((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      const updated = await apiUpdateCase(id, patch as any);
      // Update with full response to get assignedToName and assignedToEmail
      setCases((list) => list.map((x) => (x.id === id ? { ...x, ...updated } : x)));
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
    // Get all child suite IDs recursively
    const getAllChildSuiteIds = (suiteId: number): number[] => {
      const children = getChildSuites(suiteId);
      const childIds = children.map(c => c.id);
      const nestedIds = children.flatMap(c => getAllChildSuiteIds(c.id));
      return [...childIds, ...nestedIds];
    };

    // Get all case IDs from suite and children recursively
    const getAllCaseIds = (suiteId: number): number[] => {
      const directCases = grouped.get(String(suiteId)) ?? [];
      const directCaseIds = directCases.map(c => c.id);
      const children = getChildSuites(suiteId);
      const childCaseIds = children.flatMap(c => getAllCaseIds(c.id));
      return [...directCaseIds, ...childCaseIds];
    };

    if (suiteKey === "project") {
      // For project suite, just select direct cases
      const ids = grouped.get(suiteKey) ?? [];
      setSelectedCases((prev) => {
        const ns = new Set(prev);
        ids.forEach((c) => (v ? ns.add(c.id) : ns.delete(c.id)));
        return ns;
      });
    } else {
      const suiteId = Number(suiteKey);

      // Get all cases (direct + nested)
      const allCaseIds = getAllCaseIds(suiteId);

      // Get all child suites
      const allChildSuiteIds = getAllChildSuiteIds(suiteId);

      // Update selected cases
      setSelectedCases((prev) => {
        const ns = new Set(prev);
        allCaseIds.forEach((id) => (v ? ns.add(id) : ns.delete(id)));
        return ns;
      });

      // Update selected suites
      setSelectedSuites((prev) => {
        const ns = new Set(prev);
        if (v) {
          ns.add(suiteId);
          allChildSuiteIds.forEach(id => ns.add(id));
        } else {
          ns.delete(suiteId);
          allChildSuiteIds.forEach(id => ns.delete(id));
        }
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

  const selectAll = () => {
    // Select all suites
    setSelectedSuites(new Set(suites.map(s => s.id)));
    // Select all cases
    setSelectedCases(new Set(cases.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedSuites(new Set());
    setSelectedCases(new Set());
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
      // Clear selections immediately to hide the delete button
      setSelectedSuites(new Set());
      setSelectedCases(new Set());

      // Delete suites using batch API
      if (suiteIds.length > 0) {
        try {
          const result = await batchDeleteSuites(suiteIds);
          alertMsg(`Deleted ${result.deletedCount} suite(s) (including nested suites)`, "info");
          // Reload data to get updated suite list (cascading delete may have removed more)
          await loadData();
        } catch (e: any) {
          alertMsg(e?.response?.data?.message || "Failed to delete suites");
        }
      }

      // Delete cases one by one
      for (const cid of caseIds) {
        try {
          await apiDeleteCase(cid);
          setCases((prev) => prev.filter((c) => c.id !== cid));
        } catch (e: any) {
          alertMsg(e?.response?.data?.message || `Failed to delete case #${cid}`);
        }
      }
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

  // Build dynamic grid template based on visible columns
  const gridTemplate = buildGridTemplate(cols);

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
    projectId,
    dataVersion,
    groupMembers: groupMembers.map(m => ({
      userId: m.userId,
      name: m.userName,
      email: m.userEmail,
    })),
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
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        totalSuites={suites.length}
        totalCases={cases.length}
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
      <section className="space-y-6">
        {!q.trim() && (
          <CaseSuiteCard
            suiteKey="project"
            suiteId={0}
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
            gridTemplate={gridTemplate}
            suiteSelectable={false}
            suiteChecked={false}
            suiteIndeterminate={false}
            onSuiteCheck={() => {}}
            renameControls={null}
            {...caseRowsProps}
          />
        )}

        {suitesToRender.map((suite) => {
          // Calculate total cases including nested suites recursively
          const getTotalCasesCount = (suiteId: number): number => {
            const directCases = grouped.get(String(suiteId)) ?? [];
            const children = getChildSuites(suiteId);
            const childrenCases = children.reduce((sum, child) => sum + getTotalCasesCount(child.id), 0);
            return directCases.length + childrenCases;
          };

          const renderSuiteWithChildren = (s: Suite): React.ReactElement => {
            const suiteKey = String(s.id);
            const suiteCases = grouped.get(suiteKey) ?? [];
            const open = !!openSuites[suiteKey];
            const suiteSortDir = caseSortPerSuite[suiteKey] || defaultCaseSortDir;
            const totalSelected = suiteCases.filter((c) => selectedCases.has(c.id)).length;
            const suiteChecked = selectedSuites.has(s.id);
            const suiteIndeterminate =
              suiteCases.length > 0 && totalSelected > 0 && totalSelected < suiteCases.length;
            const isRenamingSuite = editingSuiteId === s.id;
            const childSuites = getChildSuites(s.id);

            const hasCases = suiteCases.length > 0;
            const totalCasesCount = getTotalCasesCount(s.id);

            // Build display title - always show just the suite name
            const displayTitle = s.name;

            return (
              <div key={suiteKey}>
                <CaseSuiteCard
                  suiteKey={suiteKey}
                  suiteId={s.id}
                  title={displayTitle}
                  icon={<FolderIcon className="text-slate-700 dark:text-slate-300" />}
                  description={`${totalCasesCount} case(s)`}
                  open={open}
                  onToggle={() => toggleSuiteOpen(suiteKey)}
                  onAddCase={() => goNewCase(s.id)}
                  onAddSubsuite={() => {
                    setParentSuiteForNew(s.id);
                    setShowSuiteModal(true);
                  }}
                  depth={s.depth}
                  sortDir={suiteSortDir}
                  onToggleSort={() => toggleSuiteSortDirection(suiteKey)}
                  onDragOver={allowDrop(suiteKey)}
                  onDrop={dropTo(suiteKey)}
                  cols={cols}
                  cases={suiteCases}
                  gridTemplate={gridTemplate}
                  suiteSelectable
                  suiteChecked={suiteChecked}
                  suiteIndeterminate={suiteIndeterminate && !suiteChecked}
                  onSuiteCheck={(checked) => toggleSuiteCheckbox(suiteKey, checked)}
                  hasChildSuites={childSuites.length > 0}
                  renameControls={{
                    showRename: !isRenamingSuite,
                    onStartRename: () => startRenameSuite(s),
                    isRenaming: isRenamingSuite,
                    renameName: editSuiteName,
                    setRenameName: setEditSuiteName,
                    onSaveRename: saveRename,
                    onCancelRename: cancelRename,
                  }}
                  {...caseRowsProps}
                />
                {/* Render child suites only when parent is open */}
                {open && childSuites.length > 0 && (
                  <div className={suiteCases.length > 0
                    ? "mt-3 pl-4 space-y-3 border-l-2 border-slate-200 dark:border-slate-700"
                    : "mt-3 space-y-3"
                  }>
                    {childSuites.map(child => renderSuiteWithChildren(child))}
                  </div>
                )}
              </div>
            );
          };

          return renderSuiteWithChildren(suite);
        })}
      </section>

      {/* Create Suite */}
      {showSuiteModal && (
        <CreateSuiteModal
          projectId={projectId}
          parentSuiteId={parentSuiteForNew}
          availableSuites={suites}
          onClose={() => {
            setShowSuiteModal(false);
            setParentSuiteForNew(null);
          }}
          onCreated={(s) => {
            setSuites((prev) => [s, ...prev]);
            setOpenSuites((o) => ({ ...o, [s.id]: true }));
            setParentSuiteForNew(null);
          }}
        />
      )}

      {confirm.ui}
    </div>
  );
}

// Wrapper component with JiraBatchProvider
export default function TestCasesPage() {
  return (
    <JiraBatchProvider>
      <TestCasesPageContent />
    </JiraBatchProvider>
  );
}
