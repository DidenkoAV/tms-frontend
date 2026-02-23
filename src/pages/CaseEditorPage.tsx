// src/pages/CaseEditorPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { http } from "@/lib/http";

// Entities (new structure)
import {
  createCase as apiCreateCase,
  updateCase as apiUpdateCase,
} from "@/entities/test-case";
import { parseDuration, formatDuration } from "@/shared/utils/duration";

import type {
  TestCase,
  TestCaseUpdate,
  PriorityLabel,
  CaseTypeLabel,
  AutomationLabel,
  Step,
} from "@/entities/test-case";

import {
  PRIORITY_ID_TO_LABEL,
  PRIORITY_LABEL_TO_ID,
  TYPE_ID_TO_LABEL,
  TYPE_LABEL_TO_ID,
  AUTO_STATUS_TO_LABEL,
  AUTO_LABEL_TO_STATUS,
} from "@/entities/test-case";

import {
  CaseTitleField,
  CasePreconditionsBlock,
  CaseStepsBlock,
  CaseMeta,
  CaseExpectedResult,
  CaseActualResult,
  AutotestMappingBlock,
  type StepForm as StepFormLocal,
} from "@/features/test-cases";
import InlineAlert from "@/shared/ui/feedback/InlineAlert";

type Suite = {
  id: number;
  projectId: number;
  name: string;
  description?: string | null;
  archived: boolean;
};

export type FormState = {
  suiteId: number | "";
  title: string;
  preconditions: string;
  steps: StepFormLocal[];
  expectedResult: string;
  actualResult: string;
  testData: string;
  priority: PriorityLabel;
  type: CaseTypeLabel;
  automationStatus: AutomationLabel;
  status: string;
  estimate: string;
  tags: string[];
  attachments: File[];
  autotestMapping: { id: number; name: string; value: string }[];
};

const DEF_FORM: FormState = {
  suiteId: "",
  title: "",
  preconditions: "",
  steps: [],
  expectedResult: "",
  actualResult: "",
  testData: "",
  priority: "Medium",
  type: "Functional",
  automationStatus: "Manual",
  status: "Passed",
  estimate: "",
  tags: [],
  attachments: [],
  autotestMapping: [],
};

const MIN_TITLE = 1;

export default function CaseEditorPage() {
  const { id, caseId } = useParams();
  const projectId = Number(id ?? NaN);
  const editingId = caseId ? Number(caseId) : null;
  const isEdit = Number.isFinite(editingId as number);
  const nav = useNavigate();

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const suiteFromQuery = searchParams.get("suiteId");

  const runIdFromQuery = searchParams.get("runId");
  const inRunContext =
    !!runIdFromQuery || Boolean((location.state as any)?.fromRun);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [form, setForm] = useState<FormState>(DEF_FORM);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  useEffect(() => {
    if (!err) return;
    const timer = setTimeout(() => setErr(null), 5000);
    return () => clearTimeout(timer);
  }, [err]);

  useEffect(() => {
    if (!savedOnce) return;
    const timer = setTimeout(() => setSavedOnce(false), 3000);
    return () => clearTimeout(timer);
  }, [savedOnce]);

  const [showPreconditionsPreview, setShowPreconditionsPreview] =
    useState(false);

  /* ------------ load ------------ */
  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      nav("/projects", { replace: true });
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const suitesRes = await http.get<Suite[]>(
          `/api/projects/${projectId}/suites`
        );
        if (!alive) return;
        setSuites(suitesRes.data);

        if (isEdit) {
          const caseRes = await http.get<TestCase>(`/api/cases/${editingId}`);
          if (!alive) return;
          const bk = caseRes.data;

          const steps: StepFormLocal[] = (bk.steps ?? []).map((st) => ({
            action: (st.action ?? "").trim(),
            expected: (st.expected ?? "").trim(),
          }));

          const mapping = Array.isArray(bk.autotestMapping)
            ? bk.autotestMapping.map((m, idx) => ({
                id: Date.now() + idx,
                name: m.name ?? "",
                value: m.value ?? "",
              }))
            : [];

          setForm({
            suiteId: bk.suiteId ?? "",
            title: bk.title ?? "",
            preconditions: bk.preconditions ?? "",
            steps,
            expectedResult: bk.expectedResult ?? "",
            actualResult: bk.actualResult ?? "",
            testData: bk.testData ?? "",
            priority: PRIORITY_ID_TO_LABEL[bk.priorityId ?? 2] ?? "Medium",
            type: TYPE_ID_TO_LABEL[bk.typeId ?? 1] ?? "Functional",
            automationStatus:
              AUTO_STATUS_TO_LABEL[bk.automationStatus ?? "NOT_AUTOMATED"] ??
              "Manual",
            status: bk.status ?? "Passed",
            estimate: bk.estimateSeconds
              ? formatDuration(bk.estimateSeconds)
              : "",
            tags: (bk.tags ?? []).map((t) => t.trim()).filter(Boolean),
            attachments: [],
            autotestMapping: mapping,
          });
        } else {
          setForm((prev) => ({
            ...prev,
            suiteId: suiteFromQuery ? Number(suiteFromQuery) : "",
          }));
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, isEdit, editingId, suiteFromQuery, nav]);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (form.title.trim().length < MIN_TITLE)
      e.title = `Please enter a title (min ${MIN_TITLE} char).`;
    return e;
  }, [form.title]);
  const isValid = Object.keys(errors).length === 0;

  function buildPayload(): TestCaseUpdate {
    const text = (v: string) =>
      isEdit
        ? v.trim() === ""
          ? null
          : v.trim()
        : v.trim() === ""
        ? undefined
        : v.trim();
    const numOrNull = (n: number | null) =>
      isEdit ? (n === null ? null : n) : n === null ? undefined : n;

    const estimateSeconds = parseDuration(form.estimate ?? "");
    const stepsNormalized: Step[] = form.steps
      .map((s) => ({
        action: (s.action ?? "").trim(),
        expected: (s.expected ?? "").trim(),
      }))
      .filter((s) => s.action.length > 0 || s.expected.length > 0);

    const mappingNormalized =
      form.autotestMapping.length > 0
        ? Object.fromEntries(
            form.autotestMapping
              .filter((m) => m.name.trim() && m.value.trim())
              .map((m) => [m.name.trim(), m.value.trim()])
          )
        : undefined;

    return {
      title: form.title.trim(),
      suiteId: typeof form.suiteId === "number" ? form.suiteId : null,
      typeId: TYPE_LABEL_TO_ID[form.type],
      priorityId: PRIORITY_LABEL_TO_ID[form.priority],
      estimateSeconds: numOrNull(estimateSeconds),
      preconditions: text(form.preconditions),
      expectedResult: text(form.expectedResult),
      actualResult: text(form.actualResult),
      testData: text(form.testData),
      steps: isEdit
        ? stepsNormalized
        : stepsNormalized.length
        ? stepsNormalized
        : undefined,
      ...(inRunContext ? { status: (form.status || undefined) as any } : {}),
      automationStatus: AUTO_LABEL_TO_STATUS[form.automationStatus],
      tags: form.tags,
      autotestMapping: mappingNormalized,
    };
  }

  async function save(closeAfter?: boolean) {
    if (!isValid || saving) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = buildPayload();
      if (isEdit) {
        const data = await apiUpdateCase(editingId as number, payload);
        setSavedOnce(true);
        if (closeAfter) nav(`/projects/${projectId}/cases/${data.id}`);
      } else {
        const data = await apiCreateCase(projectId, payload as any);
        setSavedOnce(true);
        if (closeAfter) {
          nav(`/projects/${projectId}/cases/${data.id}`);
        } else {
          nav(`/projects/${projectId}/cases/${data.id}/edit`, {
            replace: true,
          });
        }
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const selectedSuiteName = useMemo(() => {
    if (form.suiteId === "" || form.suiteId == null) return "No suite";
    const suite = suites.find((s) => s.id === form.suiteId);
    return suite?.name ?? "Suite";
  }, [form.suiteId, suites]);

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      <CaseTitleField
        mode="edit"
        backHref={`/projects/${projectId}/test-cases`}
        backLabel="Back to test cases"
        heading={isEdit ? "Edit test case" : "New test case"}
        badge={isEdit && editingId ? `Case ID ${editingId}` : undefined}
        title={form.title}
        error={errors.title}
        onChangeTitle={(next) => setForm((prev) => ({ ...prev, title: next }))}
        onSave={save}
        saving={saving}
        isValid={isValid}
      />

      {err && <InlineAlert variant="error">{err}</InlineAlert>}
      {savedOnce && !err && <InlineAlert variant="success">Saved</InlineAlert>}

      {loading ? (
        <div className="rounded-2xl border p-5 border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1524] text-slate-400">
          Loading…
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* left column */}
          <div className="grid gap-4 lg:col-span-2">
            <CasePreconditionsBlock
              value={form.preconditions}
              preview={showPreconditionsPreview}
              onChange={(v) => setForm((f) => ({ ...f, preconditions: v }))}
              onTogglePreview={setShowPreconditionsPreview}
            />
            <CaseStepsBlock
              steps={form.steps}
              onChange={(steps) => setForm((f) => ({ ...f, steps }))}
            />
            <div className="grid gap-4">
              <CaseExpectedResult
                mode="form"
                value={form.expectedResult}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, expectedResult: v }))
                }
              />
              <CaseActualResult
                mode="form"
                value={form.actualResult}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, actualResult: v }))
                }
              />
            </div>
          </div>

          {/* right column */}
          <div className="grid gap-4 lg:sticky lg:top-24">
            <CaseMeta
              suiteName={selectedSuiteName}
              priority={form.priority}
              type={form.type}
              automation={form.automationStatus}
              estimate={form.estimate}
              tags={form.tags}
              onChangePriority={(v) => setForm((p) => ({ ...p, priority: v }))}
              onChangeType={(v) => setForm((p) => ({ ...p, type: v }))}
              onChangeAutomation={(v) =>
                setForm((p) => ({ ...p, automationStatus: v }))
              }
              onChangeEstimate={(v) => setForm((p) => ({ ...p, estimate: v }))}
              onChangeTags={(v) => setForm((p) => ({ ...p, tags: v }))}
              status={inRunContext ? form.status : undefined}
              onChangeStatus={
                inRunContext
                  ? (v) => setForm((p) => ({ ...p, status: v }))
                  : undefined
              }
              testData={form.testData}
              onChangeTestData={(v) => setForm((p) => ({ ...p, testData: v }))}
              attachments={form.attachments}
              onChangeAttachments={(f) =>
                setForm((p) => ({ ...p, attachments: f }))
              }
            />

            <AutotestMappingBlock
              fields={form.autotestMapping}
              onChange={(next) =>
                setForm((p) => ({ ...p, autotestMapping: next }))
              }
              onSave={() => save(false)}
              saving={saving}
              defaultEditing
            />
          </div>
        </form>
      )}
    </div>
  );
}
