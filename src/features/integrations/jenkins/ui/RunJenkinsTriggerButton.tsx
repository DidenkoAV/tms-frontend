// src/features/jenkins/components/RunJenkinsTriggerButton.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Play,
  AlertTriangle,
  Settings as SettingsIcon,
  ChevronDown,
} from "lucide-react";
import {
  getJenkinsConnection,
  triggerJenkinsRun,
  saveJenkinsConnection,
  type JenkinsJobDto,
} from "@/features/integrations/jenkins/api";
import type { AutomationStatus } from "@/entities/test-case";
import { AlertBanner } from "@/shared/ui/alert";

type Props = {
  groupId: number;
  runId: number;
  disabled?: boolean;
  runCases?: RunCaseSummary[];
  selectedCaseIds?: number[];
};

type Banner = { type: "ok" | "err"; text: string } | null;

/** Maps 1:1 to backend enum JenkinsTriggerType (ALL/AUTOMATED/SELECTED) */
type TriggerScope = "all" | "automated" | "selected";

type RunCaseSummary = {
  caseId: number;
  automationStatus?: AutomationStatus | null;
  title?: string | null;
};

const SELECT_KEY = (groupId: number, runId: number) =>
  `run.jenkins.job.${groupId}.${runId}`;

function parseJobs(raw?: string | null): JenkinsJobDto[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      if (!line.includes("::")) {
        return { key: `${line}-${index}`, jobPath: line, name: line };
      }
      const [namePart, pathPart] = line.split("::");
      const jobPath = (pathPart ?? namePart ?? "").trim();
      const name = (namePart ?? pathPart ?? "").trim() || jobPath;
      return { key: `${jobPath}-${index}`, jobPath, name };
    })
    .filter((job) => job.jobPath.length > 0);
}

function serializeJobs(jobs: JenkinsJobDto[]) {
  return jobs
    .filter((job) => job.jobPath.trim())
    .map((job) => {
      const name = job.name?.trim() || job.jobPath.trim();
      return `${name}::${job.jobPath.trim()}`;
    })
    .join("\n");
}

export default function RunJenkinsTriggerButton({
  groupId,
  runId,
  disabled,
  runCases = [],
  selectedCaseIds = [],
}: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JenkinsJobDto[]>([]);
  const [selectedJobPath, setSelectedJobPath] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [triggering, setTriggering] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobPath, setNewJobPath] = useState("");
  const [savingJobs, setSavingJobs] = useState(false);
  const [connectionMeta, setConnectionMeta] = useState<{
    baseUrl: string;
    username?: string | null;
  } | null>(null);

  const totalRunCaseCount = runCases.length;

  const automatedCaseIds = useMemo(
    () =>
      runCases
        .filter((rc) => rc.automationStatus === "AUTOMATED")
        .map((rc) => rc.caseId),
    [runCases]
  );

  const runCaseIdSet = useMemo(
    () => new Set(runCases.map((rc) => rc.caseId)),
    [runCases]
  );

  const selectionIds = useMemo(
    () => selectedCaseIds.filter((id) => runCaseIdSet.has(id)),
    [selectedCaseIds, runCaseIdSet]
  );

  const selectedJob = jobs.find((job) => job.jobPath === selectedJobPath);
  const selectedJobLabel = selectedJob?.name || selectedJobPath;

  const canRunAutomated = automatedCaseIds.length > 0;
  const canRunSelected = selectionIds.length > 0;

  const optionBtnClasses =
    "w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-[11px] transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setBanner(null);
      try {
        const conn = await getJenkinsConnection(groupId);
        if (!alive) return;

        const available =
          (conn?.jobs?.length ? conn.jobs : parseJobs(conn?.jobPath)) ?? [];
        setJobs(available);

        if (conn?.baseUrl) {
          setConnectionMeta({ baseUrl: conn.baseUrl, username: conn.username });
        }

        if (available.length > 0) {
          const stored = localStorage.getItem(SELECT_KEY(groupId, runId));
          const match = available.find((j) => j.jobPath === stored);
          setSelectedJobPath(match?.jobPath ?? available[0].jobPath);
        } else {
          setSelectedJobPath("");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [groupId, runId]);

  useEffect(() => {
    if (selectedJobPath) {
      localStorage.setItem(SELECT_KEY(groupId, runId), selectedJobPath);
    } else {
      localStorage.removeItem(SELECT_KEY(groupId, runId));
    }
  }, [selectedJobPath, groupId, runId]);

  useEffect(() => {
    if (settingsOpen) setRunMenuOpen(false);
  }, [settingsOpen]);

  function setMsg(msg: Banner, ms = 2600) {
    setBanner(msg);
    if (msg && ms) {
      window.setTimeout(() => setBanner(null), ms);
    }
  }

  const scopeDescriptions: Record<TriggerScope, string> = {
    all: "the entire run",
    automated: "automated tests",
    selected: "selected tests",
  };

  async function triggerScope(scope: TriggerScope) {
    if (!selectedJobPath) {
      setMsg({ type: "err", text: "Select Jenkins job first" }, 0);
      setRunMenuOpen(false);
      return;
    }

    let caseIds: number[] | undefined;

    if (scope === "automated") {
      if (!automatedCaseIds.length) {
        setMsg(
          {
            type: "err",
            text: "No automated tests are available in this run",
          },
          0
        );
        return;
      }
      caseIds = automatedCaseIds;
    } else if (scope === "selected") {
      if (!selectionIds.length) {
        setMsg(
          {
            type: "err",
            text: "Pick tests in the table to run a selection",
          },
          0
        );
        return;
      }
      caseIds = selectionIds;
    }

    setRunMenuOpen(false);
    setTriggering(true);
    setMsg(null);

    try {
      await triggerJenkinsRun({
        groupId,
        runId,
        jobPath: selectedJobPath,
        caseIds,
        // Key line: explicitly pass trigger type to backend
        triggerType: scope,
      });

      const countSuffix =
        caseIds && caseIds.length
          ? ` (${caseIds.length} ${caseIds.length === 1 ? "test" : "tests"})`
          : "";

      setMsg({
        type: "ok",
        text: `Jenkins build queued for ${scopeDescriptions[scope]}${countSuffix}`,
      });
    } catch (e: any) {
      setMsg(
        {
          type: "err",
          text:
            e?.response?.data?.message ||
            "Failed to trigger Jenkins build for this run",
        },
        0
      );
    } finally {
      setTriggering(false);
    }
  }

  const isBusy = loading || triggering;
  const isDisabled = disabled || isBusy || jobs.length === 0;

  useEffect(() => {
    if (isDisabled) setRunMenuOpen(false);
  }, [isDisabled]);

  async function persistJobs(nextJobs: JenkinsJobDto[], success: string) {
    if (!connectionMeta?.baseUrl) {
      setMsg(
        {
          type: "err",
          text: "Configure Jenkins integration first",
        },
        0
      );
      return;
    }
    setSavingJobs(true);
    try {
      const saved = await saveJenkinsConnection(groupId, {
        baseUrl: connectionMeta.baseUrl,
        username: connectionMeta.username || undefined,
        jobPath: serializeJobs(nextJobs),
      });

      const refreshed =
        saved.jobs?.length && saved.jobs[0].jobPath
          ? saved.jobs
          : parseJobs(saved.jobPath);

      setJobs(refreshed ?? nextJobs);
      setConnectionMeta({ baseUrl: saved.baseUrl, username: saved.username });
      setMsg({ type: "ok", text: success });
    } catch (e: any) {
      setMsg(
        {
          type: "err",
          text: e?.response?.data?.message || "Failed to update Jenkins jobs",
        },
        0
      );
    } finally {
      setSavingJobs(false);
    }
  }

  return (
    <div className="relative flex flex-col items-end gap-1">
      {banner && (
        <div className="fixed z-50 w-full max-w-sm px-4 -translate-x-1/2 top-6 left-1/2 drop-shadow-2xl">
          <AlertBanner
            kind={banner.type === "err" ? "error" : "success"}
            className="bg-white dark:bg-[#0f1524]"
          >
            <div className="flex items-center justify-between text-[13px] font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-200">
              {banner.type === "err" ? "Error" : "Status"}
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="rounded-full px-2 text-[13px] font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-[12px] font-medium leading-snug text-slate-800 dark:text-slate-100">
              {banner.text}
            </p>
          </AlertBanner>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Run in Jenkins + scope menu */}
        <div className="relative">
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              setRunMenuOpen((v) => !v);
              setSettingsOpen(false);
            }}
            className={[
              "inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1 text-xs font-medium shadow-sm transition",
              isDisabled
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                : "border-emerald-500/80 bg-emerald-50 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:border-emerald-300 dark:hover:bg-emerald-900/50",
            ].join(" ")}
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>Run in Jenkins</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {runMenuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <div className="mb-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Select what to run
                </div>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {totalRunCaseCount} test
                  {totalRunCaseCount === 1 ? "" : "s"} available in this run.
                </p>
                {selectedJobLabel ? (
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    Using job:{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {selectedJobLabel}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-rose-500">
                    Select Jenkins job in settings first.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  className={optionBtnClasses}
                  onClick={() => triggerScope("all")}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                    <span>Run entire run</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {totalRunCaseCount}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Includes manual and in-progress tests.
                  </div>
                </button>

                <button
                  type="button"
                  className={optionBtnClasses}
                  disabled={!canRunAutomated}
                  onClick={() => triggerScope("automated")}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                    <span>Run automated tests</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {automatedCaseIds.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Only cases with automation status = Automated.
                  </div>
                </button>

                <button
                  type="button"
                  className={optionBtnClasses}
                  disabled={!canRunSelected}
                  onClick={() => triggerScope("selected")}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                    <span>Run selected tests</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {selectionIds.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Pick tests in the run table to enable this action.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings button + dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setSettingsOpen((v) => !v);
              setRunMenuOpen(false);
            }}
            disabled={loading}
            className="inline-flex items-center justify-center w-8 h-8 border rounded-full border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
            title="Configure Jenkins jobs"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-[11px] shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Jenkins jobs for this run
                </span>
                <button
                  type="button"
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  onClick={() => setSettingsOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <p>Select which job should be tied to this run.</p>
                <p>Jobs added here are saved to the Jenkins integration.</p>
              </div>

              <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

              {/* Add job */}
              <div className="mb-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                Add job
              </div>

              <input
                className="mb-2 w-full rounded-lg border border-slate-300 px-2 py-1 text-[11px] outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                placeholder="Display name (optional)"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
              />

              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-[11px] outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  placeholder="/job/path"
                  value={newJobPath}
                  onChange={(e) => setNewJobPath(e.target.value)}
                />
                <button
                  type="button"
                  disabled={savingJobs}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/60 dark:bg-emerald-900/30 dark:text-emerald-300"
                  onClick={() => {
                    const trimmed = newJobPath.trim();
                    if (!trimmed) {
                      setMsg({ type: "err", text: "Job path is required" }, 0);
                      return;
                    }
                    const nextJob: JenkinsJobDto = {
                      key: `${Date.now()}`,
                      name: newJobName.trim() || trimmed,
                      jobPath: trimmed,
                    };
                    persistJobs([...jobs, nextJob], "Jenkins job saved");
                    setNewJobName("");
                    setNewJobPath("");
                  }}
                >
                  {savingJobs ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "+"
                  )}
                </button>
              </div>

              <div className="my-3 border-t border-slate-200 dark:border-slate-700" />

              {/* Job list */}
              <div className="space-y-2 overflow-y-auto max-h-52">
                {jobs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    No jobs yet.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.key}
                      className="flex items-start justify-between rounded-lg border border-slate-200 p-2 text-[11px] dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                          {job.name}
                          {job.jobPath === selectedJobPath && (
                            <span className="rounded-full bg-emerald-50 px-2 py-[1px] text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {job.jobPath}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <button
                          className="rounded-md border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                          onClick={() => {
                            setSelectedJobPath(job.jobPath);
                            setMsg({
                              type: "ok",
                              text: `Selected ${job.name}`,
                            });
                            setSettingsOpen(false);
                          }}
                        >
                          Use
                        </button>
                        <button
                          className="rounded-md border border-rose-300 px-2 py-0.5 text-[10px] text-rose-500 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/30"
                          onClick={() => {
                            const remaining = jobs.filter(
                              (i) => i.key !== job.key
                            );
                            persistJobs(remaining, "Job removed");
                            if (selectedJobPath === job.jobPath) {
                              setSelectedJobPath(
                                remaining[0]?.jobPath || ""
                              );
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                onClick={() => {
                  setSettingsOpen(false);
                  navigate("/account?tab=integrations");
                }}
              >
                Manage Jenkins integration…
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedJobLabel && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          Linked Jenkins job:{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {selectedJobLabel}
          </span>
        </div>
      )}

      {jobs.length === 0 && !loading && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>No jobs – configure Jenkins integration for this group.</span>
        </div>
      )}
    </div>
  );
}
