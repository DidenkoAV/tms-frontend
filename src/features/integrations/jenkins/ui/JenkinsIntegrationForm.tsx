// src/features/jenkins/components/JenkinsIntegrationForm.tsx

import { useEffect, useState } from "react";
import {
  getJenkinsConnection,
  saveJenkinsConnection,
  removeJenkinsConnection,
  testJenkinsConnection,
} from "@/features/integrations/jenkins/api";

type Msg = { type: "ok" | "err"; text: string } | null;

type JenkinsJobDef = {
  name: string;
  path: string;
};

interface Props {
  groupId: number;
  Field: React.FC<{ label: string; children: React.ReactNode }>;
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  ButtonDangerOutline: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement>
  >;
  onStatusChange?: (connected: boolean) => void;
}

/**
 * jobPath format in DB:
 *   name::/job/path
 * or legacy:
 *   /job/path
 */
function parseJobs(raw: string | null | undefined): JenkinsJobDef[] {
  if (!raw) return [];

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // legacy case: only path was stored
      if (!line.includes("::")) {
        const v = line.trim();
        return { name: v, path: v };
      }

      const [namePart, pathPart] = line.split("::");
      const name = (namePart ?? pathPart ?? "").trim();
      const path = (pathPart ?? namePart ?? "").trim();

      return { name, path };
    })
    .filter((j) => j.path.length > 0);
}

function serializeJobs(jobs: JenkinsJobDef[]): string {
  return jobs
    .filter((j) => j.path.trim().length > 0)
    .map((j) => {
      const name = j.name.trim() || j.path.trim();
      return `${name}::${j.path.trim()}`;
    })
    .join("\n");
}

export default function JenkinsIntegrationForm({
  groupId,
  Field,
  Input,
  ButtonPrimary,
  ButtonDangerOutline,
  onStatusChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg>(null);

  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [hasSavedToken, setHasSavedToken] = useState(false);

  const [jobs, setJobs] = useState<JenkinsJobDef[]>([]);
  const [newJobName, setNewJobName] = useState("");
  const [newJobPath, setNewJobPath] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setMsg(null);

      try {
        const conn = await getJenkinsConnection(groupId);
        if (!alive) return;

        if (conn) {
          setBaseUrl(conn.baseUrl || "");
          setUsername(conn.username || "");
          setHasSavedToken(!!conn.apiTokenMasked);
          setJobs(parseJobs(conn.jobPath));
          onStatusChange?.(conn.active ?? false);
        } else {
          setBaseUrl("");
          setUsername("");
          setHasSavedToken(false);
          setJobs([]);
          onStatusChange?.(false);
        }
      } catch (e) {
        if (alive) {
          setBaseUrl("");
          setUsername("");
          setHasSavedToken(false);
          setJobs([]);
          onStatusChange?.(false);
          setMsg({
            type: "err",
            text: "Failed to load Jenkins connection",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  function clearMsgSoon() {
    setTimeout(() => setMsg(null), 3000);
  }

  function addJob() {
    if (!newJobPath.trim()) {
      setMsg({
        type: "err",
        text: "Job path is required.",
      });
      clearMsgSoon();
      return;
    }

    setJobs((prev) => [
      ...prev,
      {
        name: newJobName.trim(),
        path: newJobPath.trim(),
      },
    ]);

    setNewJobName("");
    setNewJobPath("");
  }

  function removeJob(index: number) {
    setJobs((prev) => prev.filter((_, i) => i !== index));
  }

  function updateJob(
    index: number,
    field: keyof JenkinsJobDef,
    value: string
  ) {
    setJobs((prev) =>
      prev.map((job, i) =>
        i === index ? { ...job, [field]: value } : job
      )
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const jobPath = serializeJobs(jobs);

      const saved = await saveJenkinsConnection(groupId, {
        baseUrl,
        jobPath,
        username: username || undefined,
        apiToken: apiToken || undefined,
      });

      // Sync with what backend actually saved
      setJobs(parseJobs(saved.jobPath));
      onStatusChange?.(saved.active ?? false);

      if (apiToken) {
        setHasSavedToken(true);
        setApiToken("");
      }

      setMsg({
        type: "ok",
        text: "Jenkins connection saved. Please test the connection.",
      });
    } catch (e: any) {
      setMsg({
        type: "err",
        text:
          e?.response?.data?.message || "Failed to save Jenkins connection",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onTest() {
    try {
      const message = await testJenkinsConnection(groupId);
      setMsg({ type: "ok", text: message });
      onStatusChange?.(true);
    } catch (e: any) {
      setMsg({
        type: "err",
        text:
          e?.response?.data?.message || "Jenkins connection test failed",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onRemove() {
    if (!window.confirm("Remove Jenkins connection?")) return;

    try {
      await removeJenkinsConnection(groupId);
      setBaseUrl("");
      setUsername("");
      setApiToken("");
      setHasSavedToken(false);
      setJobs([]);
      setMsg({ type: "ok", text: "Jenkins connection removed." });
      onStatusChange?.(false);
    } catch (e: any) {
      setMsg({
        type: "err",
        text:
          e?.response?.data?.message ||
          "Failed to remove Jenkins connection",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {msg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
            msg.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Loading Jenkins settings...
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <Field label="Jenkins URL">
              <Input
                className="w-full px-3 text-sm transition-colors border rounded-lg h-9 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://jenkins.your-company.com"
              />
            </Field>

            <Field label="Username (optional)">
              <Input
                className="w-full px-3 text-sm transition-colors border rounded-lg h-9 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jenkins-user"
              />
            </Field>

            <Field label={`API Token ${hasSavedToken ? "• Saved" : ""}`}>
              <Input
                className="w-full px-3 text-sm transition-colors border rounded-lg h-9 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                type="password"
                value={hasSavedToken && !apiToken ? "••••••••••••" : apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={
                  hasSavedToken
                    ? "Enter new token to update"
                    : "your-api-token"
                }
              />
              {hasSavedToken && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Token is saved. Enter a new one only if you want to update it.
                </p>
              )}
            </Field>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <Field label="Jenkins Jobs">
              <div className="space-y-4">
                <div className="p-4 space-y-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Display Name
                      </label>
                      <Input
                        className="w-full px-3 text-sm border rounded-lg h-9 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                        value={newJobName}
                        onChange={(e) => setNewJobName(e.target.value)}
                        placeholder="Regression Suite"
                      />
                    </div>
                    <div className="flex-[1.4] space-y-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Job Path *
                      </label>
                      <Input
                        className="w-full px-3 text-sm border rounded-lg h-9 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                        value={newJobPath}
                        onChange={(e) => setNewJobPath(e.target.value)}
                        placeholder="/job/testforge-demo-pipeline"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="w-full px-3 text-sm font-medium transition-all duration-200 bg-white border rounded-lg sm:w-20 h-9 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600 dark:hover:border-slate-500"
                        onClick={addJob}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {jobs.length === 0 ? (
                  <div className="py-6 text-center border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No jobs configured yet. Add Jenkins jobs that will be
                      available for triggering runs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Configured Jobs ({jobs.length})
                    </h4>
                    <div className="space-y-2 overflow-y-auto max-h-60">
                      {jobs.map((job, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-2 p-3 transition-colors bg-white border rounded-lg sm:flex-row sm:items-center border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700/50"
                        >
                          <div className="flex-1">
                            <Input
                              className="w-full h-8 px-2 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 dark:text-white dark:focus:ring-blue-400"
                              value={job.name}
                              onChange={(e) =>
                                updateJob(idx, "name", e.target.value)
                              }
                              placeholder="Job name"
                            />
                          </div>
                          <div className="flex-[1.4]">
                            <Input
                              className="w-full h-8 px-2 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 dark:text-white dark:focus:ring-blue-400"
                              value={job.path}
                              onChange={(e) =>
                                updateJob(idx, "path", e.target.value)
                              }
                              placeholder="/job/path"
                            />
                          </div>
                          <button
                            type="button"
                            className="flex-shrink-0 w-16 h-8 px-2 text-sm font-medium transition-all duration-200 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/30"
                            onClick={() => removeJob(idx)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Field>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <ButtonPrimary type="submit">Save</ButtonPrimary>

            {hasSavedToken && (
              <>
                <ButtonPrimary type="button" onClick={onTest}>
                  Test
                </ButtonPrimary>
                <ButtonDangerOutline type="button" onClick={onRemove}>
                  Remove
                </ButtonDangerOutline>
              </>
            )}
          </div>
        </>
      )}
    </form>
  );
}
