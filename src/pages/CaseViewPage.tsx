import { useMe } from "@/features/account";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";

// Entities (new structure)
import { getCase, updateCase, listSuites } from "@/entities/test-case";
import {
  TestCase,
  PriorityLabel,
  CaseTypeLabel,
  AutomationLabel,
  PRIORITY_ID_TO_LABEL,
  PRIORITY_LABEL_TO_ID,
  TYPE_ID_TO_LABEL,
  TYPE_LABEL_TO_ID,
  AUTO_STATUS_TO_LABEL,
  AUTO_LABEL_TO_STATUS,
} from "@/entities/test-case";
import { listRunCases } from "@/entities/test-run";
import { AlertBanner } from "@/shared/ui/alert";
import { parseDuration, formatDuration } from "@/shared/utils/duration";
import { MarkdownBlock } from "@/shared/ui/markdown/TinyMarkdown";
import { RunComments } from "@/features/runs";

import {
  CasePreconditionsBlock,
  CaseStepsBlock,
  type StepForm as StepFormLocal,
  CaseExpectedResult,
  CaseActualResult,
  CaseTestData,
  CaseMeta,
  CaseTitleField,
  AutotestMappingBlock,
} from "@/features/test-cases";
import JiraIssuesBlock from "@/features/integrations/jira/ui/JiraIssuesBlock";
import { EditIcon } from "@/shared/ui/icons";

/* ---------- local helper types ---------- */
type Suite = {
  id: number;
  projectId: number;
  name: string;
  description?: string | null;
  archived: boolean;
};

type MappingField = { id: number; name: string; value: string };

/* ===== PAGE ===== */
export default function CaseViewPage() {
  const { id, caseId } = useParams();
  const projectId = Number(id ?? NaN);
  const viewId = Number(caseId ?? NaN);
  const nav = useNavigate();
  const { me } = useMe();

  const groupId = me?.currentGroupId ?? me?.groups?.[0]?.id ?? null;

  type BannerKind = "info" | "error" | "success" | "warning";
  const [banner, setBanner] = useState<{
    kind: BannerKind;
    text: string;
  } | null>(null);
  const notify = (kind: BannerKind, text: string, ms = 2400) => {
    setBanner({ kind, text });
    if (ms) setTimeout(() => setBanner(null), ms);
  };

  // ===== detect "from run" context =====
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const runIdFromQueryRaw = searchParams.get("runId");
  const runIdFromState = (location.state as any)?.runId;
  const runFlagFromState = Boolean((location.state as any)?.fromRun);

  const activeRunId = (() => {
    const n = Number(runIdFromQueryRaw ?? runIdFromState);
    return Number.isFinite(n) ? n : null;
  })();
  const inRunContext = Boolean(activeRunId) || runFlagFromState;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [item, setItem] = useState<TestCase | null>(null);

  // inline edit states
  const [editPre, setEditPre] = useState(false);
  const [draftPre, setDraftPre] = useState("");
  const [savingPre, setSavingPre] = useState(false);

  const [editSteps, setEditSteps] = useState(false);
  const [draftSteps, setDraftSteps] = useState<StepFormLocal[]>([]);
  const [savingSteps, setSavingSteps] = useState(false);

  const [editExp, setEditExp] = useState(false);
  const [draftExp, setDraftExp] = useState("");

  const [editAct, setEditAct] = useState(false);
  const [draftAct, setDraftAct] = useState("");

  const [editData, setEditData] = useState(false);
  const [draftData, setDraftData] = useState("");

  // meta
  const [draftPriority, setDraftPriority] = useState<PriorityLabel>("Medium");
  const [draftType, setDraftType] = useState<CaseTypeLabel>("Functional");
  const [draftAutomation, setDraftAutomation] =
    useState<AutomationLabel>("Manual");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [draftEstimate, setDraftEstimate] = useState<string>("");
  const [metaReady, setMetaReady] = useState(false);

  // run status
  const [runStatusId, setRunStatusId] = useState<number | null>(null);
  const [commentsRefreshTick, setCommentsRefreshTick] = useState(0);

  // autotest mapping
  const [mappingFields, setMappingFields] = useState<MappingField[]>([]);
  const [savingMapping, setSavingMapping] = useState(false);

  async function saveMapping() {
    if (!item) return;
    setSavingMapping(true);
    try {
      const mappingObj: Record<string, string> = {};
      for (const f of mappingFields) {
        if (f.name.trim()) mappingObj[f.name.trim()] = f.value ?? "";
      }
      const updated = await updateCase(item.id, {
        autotestMapping: mappingObj,
      });
      setItem(updated);
      notify("success", "Autotest mapping saved");
    } catch (e: any) {
      notify("error", e?.response?.data?.message || "Failed to save mapping");
    } finally {
      setSavingMapping(false);
    }
  }

  // ===== Load case + suites =====
  useEffect(() => {
    if (!Number.isFinite(projectId) || !Number.isFinite(viewId)) {
      nav("/projects", { replace: true });
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      setMetaReady(false);
      try {
        const [suitesRes, caseRes] = await Promise.all([
          listSuites(projectId),
          getCase(viewId),
        ]);
        if (!alive) return;

        setSuites(suitesRes);
        setItem(caseRes);

        setDraftPre(caseRes.preconditions ?? "");
        setDraftSteps(
          (caseRes.steps ?? []).map((s) => ({
            action: s.action ?? "",
            expected: s.expected ?? "",
          }))
        );
        setDraftExp(caseRes.expectedResult ?? "");
        setDraftAct(caseRes.actualResult ?? "");
        setDraftData(caseRes.testData ?? "");

        setDraftPriority(
          PRIORITY_ID_TO_LABEL[caseRes.priorityId ?? 2] ?? "Medium"
        );
        setDraftType(TYPE_ID_TO_LABEL[caseRes.typeId ?? 1] ?? "Functional");
        setDraftAutomation(
          AUTO_STATUS_TO_LABEL[caseRes.automationStatus ?? "NOT_AUTOMATED"] ??
            "Manual"
        );
        setDraftTags((caseRes.tags ?? []).map((t) => t.trim()).filter(Boolean));
        setDraftEstimate(formatDuration(caseRes.estimateSeconds));

        // autotest mapping init
        const map = caseRes.autotestMapping ?? {};
        const arr = Object.entries(map).map(([name, value], i) => ({
          id: i + 1,
          name,
          value: String(value ?? ""),
        }));
        setMappingFields(arr);

        setMetaReady(true);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load case");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, viewId, nav]);

  // ===== Load run status (if run context) =====
  useEffect(() => {
    if (!inRunContext || !activeRunId || !item?.id) return;
    let alive = true;
    (async () => {
      try {
        const rcList = await listRunCases(activeRunId);
        if (!alive) return;
        const rc = rcList.find((r) => r.caseId === item.id);
        setRunStatusId(rc?.currentStatusId ?? null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [inRunContext, activeRunId, item?.id]);

  // ===== Auto-save meta =====
  const metaSaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!item || !metaReady) return;
    const payload = {
      priorityId: PRIORITY_LABEL_TO_ID[draftPriority],
      typeId: TYPE_LABEL_TO_ID[draftType],
      automationStatus: AUTO_LABEL_TO_STATUS[draftAutomation],
      tags: draftTags,
      estimateSeconds: (() => {
        const n = parseDuration(draftEstimate);
        return draftEstimate.trim() === "" ? null : n ?? 0;
      })(),
    };
    if (metaSaveTimer.current) window.clearTimeout(metaSaveTimer.current);
    metaSaveTimer.current = window.setTimeout(async () => {
      try {
        const updated = await updateCase(item.id, payload);
        setItem(updated);
      } catch (e) {
        console.error("Auto-save meta failed", e);
      }
    }, 500) as unknown as number;
    return () => {
      if (metaSaveTimer.current) window.clearTimeout(metaSaveTimer.current);
    };
  }, [
    item?.id,
    metaReady,
    draftPriority,
    draftType,
    draftAutomation,
    draftTags,
    draftEstimate,
  ]);

  const suiteName = useMemo(() => {
    if (!item) return "—";
    if (!item.suiteId) return "No suite";
    return (
      suites.find((s) => s.id === item.suiteId)?.name ??
      `Suite #${item.suiteId}`
    );
  }, [item, suites]);

  const backHref =
    inRunContext && activeRunId
      ? `/projects/${projectId}/runs/${activeRunId}`
      : `/projects/${projectId}/test-cases`;
  const backLabel =
    inRunContext && activeRunId ? "Back to run" : "Back to test cases";

  /* ===== Save handlers ===== */
  async function savePre() {
    if (!item) return;
    const preconditions = draftPre.trim();

    setSavingPre(true);
    try {
      const updated = await updateCase(item.id, {
        preconditions: preconditions === "" ? null : preconditions,
      });

      setItem(updated);
      setDraftPre(updated.preconditions ?? ""); 
      setEditPre(false);
      notify("success", "Preconditions saved");
    } catch (e: any) {
      notify(
        "error",
        e?.response?.data?.message || "Failed to save preconditions"
      );
    } finally {
      setSavingPre(false);
    }
  }

  async function saveSteps() {
    if (!item) return;
    setSavingSteps(true);
    try {
      const updated = await updateCase(item.id, {
        steps: draftSteps.map((s) => ({
          action: s.action,
          expected: s.expected,
        })),
      });
      setItem(updated);
      setEditSteps(false);
      notify("success", "Steps saved");
    } catch (e: any) {
      notify("error", e?.response?.data?.message || "Failed to save steps");
    } finally {
      setSavingSteps(false);
    }
  }

  async function saveExp() {
    if (!item) return;
    const v = draftExp.trim();
    try {
      const updated = await updateCase(item.id, {
        expectedResult: v === "" ? null : v,
      });
      setItem(updated);
      setEditExp(false);
      notify("success", "Expected result saved");
    } catch (e: any) {
      notify(
        "error",
        e?.response?.data?.message || "Failed to save expected result"
      );
    }
  }

  async function saveAct() {
    if (!item) return;
    const v = draftAct.trim();
    try {
      const updated = await updateCase(item.id, {
        actualResult: v === "" ? null : v,
      });
      setItem(updated);
      setEditAct(false);
      notify("success", "Actual result saved");
    } catch (e: any) {
      notify(
        "error",
        e?.response?.data?.message || "Failed to save actual result"
      );
    }
  }

  async function saveData() {
    if (!item) return;
    const v = draftData.trim();
    try {
      const updated = await updateCase(item.id, {
        testData: v === "" ? null : v,
      });
      setItem(updated);
      setEditData(false);
      notify("success", "Test data saved");
    } catch (e: any) {
      notify("error", e?.response?.data?.message || "Failed to save test data");
    }
  }

  /* ===== Render ===== */
  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      {banner && (
        <AlertBanner kind={banner.kind} className="mb-4">
          {banner.text}
        </AlertBanner>
      )}

      {err && (
        <div className="px-3 py-2 mb-6 text-sm border rounded-2xl border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-200">
          {err}
        </div>
      )}

      {loading ? (
        <div className="p-4 border rounded-2xl text-slate-400">Loading…</div>
      ) : (
        item && (
          <>
            <CaseTitleField
              mode="view"
              backHref={backHref}
              backLabel={backLabel}
              heading={item.title}
              badge={`Case ID ${item.id}`}
              actions={
                <Link
                  to={`/projects/${projectId}/cases/${item.id}/edit`}
                  state={{ fromRun: inRunContext, runId: activeRunId }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  <EditIcon className="w-4 h-4" />
                  Edit All
                </Link>
              }
            />

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* ==== Left side ==== */}
              <section className="grid gap-3">
                {groupId && (
                  <JiraIssuesBlock
                    groupId={groupId}
                    runId={activeRunId ?? null}
                    testCaseId={item.id}
                    notify={notify}
                  />
                )}

                <CasePreconditionsBlock
                  value={editPre ? draftPre : item?.preconditions ?? ""}
                  onChange={editPre ? (v) => setDraftPre(v) : undefined}
                  showHeader
                  actions={
                    editPre ? (
                      <div className="flex gap-2">
                        <button
                          onClick={savePre}
                          disabled={savingPre}
                          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setDraftPre(item?.preconditions ?? "");
                            setEditPre(false);
                          }}
                          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditPre(true)}
                        className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <EditIcon className="mr-1" /> Edit
                      </button>
                    )
                  }
                />

                {/* Steps */}
                {editSteps ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1524]">
                    <CaseStepsBlock
                      steps={draftSteps}
                      onChange={setDraftSteps}
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={saveSteps}
                        disabled={savingSteps}
                        className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setDraftSteps(item?.steps ?? []);
                          setEditSteps(false);
                        }}
                        className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1524]">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold uppercase text-slate-700 dark:text-slate-300">
                        Steps
                      </h2>
                      <button
                        onClick={() => {
                          setDraftSteps(item?.steps ?? []);
                          setEditSteps(true);
                        }}
                        className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <EditIcon className="mr-1" /> Edit
                      </button>
                    </div>

                    {(item?.steps ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No steps.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {(item?.steps ?? []).map((st, idx) => {
                          const hasExpected =
                            (st.expected ?? "").trim().length > 0;
                          return (
                            <div
                              key={idx}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#0b1222]"
                            >
                              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                Step #{idx + 1}
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Action
                                </div>
                                <MarkdownBlock text={st.action ?? ""} />
                              </div>
                              {hasExpected && (
                                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                                  <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Expected
                                  </div>
                                  <MarkdownBlock text={st.expected ?? ""} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <CaseExpectedResult
                  value={item?.expectedResult ?? ""}
                  draft={draftExp}
                  editing={editExp}
                  onChangeDraft={setDraftExp}
                  onSave={saveExp}
                  onCancel={() => setEditExp(false)}
                  onEdit={() => setEditExp(true)}
                />

                <CaseActualResult
                  value={item?.actualResult ?? ""}
                  draft={draftAct}
                  editing={editAct}
                  onChangeDraft={setDraftAct}
                  onSave={saveAct}
                  onCancel={() => setEditAct(false)}
                  onEdit={() => setEditAct(true)}
                />
              </section>

              {/* ==== Right side ==== */}
              <aside className="grid gap-4">
                <CaseMeta
                  suiteName={suiteName}
                  priority={draftPriority}
                  type={draftType}
                  automation={draftAutomation}
                  estimate={draftEstimate}
                  tags={draftTags}
                  onChangePriority={setDraftPriority}
                  onChangeType={setDraftType}
                  onChangeAutomation={setDraftAutomation}
                  onChangeEstimate={setDraftEstimate}
                  onChangeTags={setDraftTags}
                  authorName={item.createdByName}
                  authorEmail={item.createdByEmail}
                  assignedToName={item.assignedToName}
                  assignedToEmail={item.assignedToEmail}
                />

                <CaseTestData
                  value={item?.testData ?? ""}
                  draft={draftData}
                  editing={editData}
                  onChangeDraft={setDraftData}
                  onSave={saveData}
                  onCancel={() => setEditData(false)}
                  onEdit={() => setEditData(true)}
                />

                <AutotestMappingBlock
                  fields={mappingFields}
                  onChange={setMappingFields}
                  onSave={saveMapping}
                  saving={savingMapping}
                />
              </aside>
            </div>

            {inRunContext && activeRunId && item && (
              <div className="mt-6">
                <RunComments
                  runId={activeRunId}
                  caseId={item.id}
                  refreshTick={commentsRefreshTick}
                  onStatusChange={(id) => {
                    setRunStatusId(typeof id === "number" ? id : null);
                    notify("success", "Status updated");
                  }}
                  notify={notify}
                />
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
