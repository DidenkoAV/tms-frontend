// src/features/jira/components/JiraIssuesBlock.tsx
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  listJiraIssues,
  listJiraIssueTypes,
  createJiraIssue,
  attachJiraIssue,
  detachJiraIssue,
} from "@/features/integrations/jira/api";

import type {
  JiraIssue,
  Attachment,
  JiraIssuesBlockProps,
} from "@/features/integrations/jira/types";

import {
  ExternalLinkIcon,
  RefreshCcwIcon,
  PlusIcon,
  Link2Icon,
  XIcon,
  PaperclipIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  Loader2Icon,
} from "lucide-react";

import { PrimaryButton } from "@/shared/ui/buttons";

/* --------------------------- Helpers --------------------------- */
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** Jira-like priority */
function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return <span className="text-xs text-slate-500 dark:text-slate-400">—</span>;
  const map: Record<string, { icon: React.ReactNode; tone: string; label: string }> = {
    Highest: {
      icon: <ChevronUpIcon className="w-3 h-3 text-rose-500" />,
      tone: "text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-300 dark:bg-rose-900/40 dark:border-rose-700",
      label: "Highest",
    },
    High: {
      icon: <ChevronUpIcon className="w-3 h-3 text-orange-500" />,
      tone: "text-orange-700 bg-orange-50 border border-orange-200 dark:text-orange-300 dark:bg-orange-900/40 dark:border-orange-700",
      label: "High",
    },
    Medium: {
      icon: <ChevronUpIcon className="w-3 h-3 rotate-90 text-amber-500" />,
      tone: "text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-900/40 dark:border-amber-700",
      label: "Medium",
    },
    Low: {
      icon: <ChevronDownIcon className="w-3 h-3 text-sky-500" />,
      tone: "text-sky-700 bg-sky-50 border border-sky-200 dark:text-sky-300 dark:bg-sky-900/40 dark:border-sky-700",
      label: "Low",
    },
    Lowest: {
      icon: <ChevronDownIcon className="w-3 h-3 text-teal-500" />,
      tone: "text-teal-700 bg-teal-50 border border-teal-200 dark:text-teal-300 dark:bg-teal-900/40 dark:border-teal-700",
      label: "Lowest",
    },
  };
  const item = map[priority] ?? { icon: null, tone: "text-slate-600 dark:text-slate-300", label: priority };
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", item.tone)}>
      {item.icon}
      {item.label}
    </span>
  );
}

/** Jira-like status */
function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-slate-500 dark:text-slate-400">—</span>;
  return (
    <span className="inline-flex items-start gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium 
      bg-slate-50 text-slate-700 border border-slate-200 
      dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700 
      max-w-[160px] break-words leading-snug">
      <ClockIcon className="w-3 h-3 mt-[2px] text-slate-500 dark:text-slate-400 shrink-0" />
      {status}
    </span>
  );
}

/* ----------------------------- Component ----------------------------- */
export default function JiraIssuesBlock({
  groupId,
  testCaseId,
  notify,
}: JiraIssuesBlockProps) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [issueType, setIssueType] = useState("Bug");
  const [description, setDescription] = useState("Created from TMS");
  const [priority, setPriority] = useState("Medium");
  const [attachKey, setAttachKey] = useState("");

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [openAttachmentsFor, setOpenAttachmentsFor] = useState<number | null>(null);
  const [hoveredIssue, setHoveredIssue] = useState<JiraIssue | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadIssues() {
    try {
      setError(null);
      setLoading(true);
      const data = await listJiraIssues(groupId, testCaseId);
      const filtered = (data || []).filter(
        (x: JiraIssue) =>
          x && x.issueKey && x.summary && x.summary !== "(unavailable)" && x.status && x.status !== "UNKNOWN"
      );
      setIssues(filtered);
    } catch (e: any) {
      if (e?.response?.status === 404) setError("no-connection");
      else setError("failed");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadIssues();
    listJiraIssueTypes(groupId)
      .then(setIssueTypes)
      .catch(() => setIssueTypes(["Bug", "Task", "Story"]));
  }, [testCaseId, groupId]);

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const actionBtnBase = "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition";
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1524] shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          className={clsx(actionBtnBase, "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}
          onClick={loadIssues}
        >
          {loading ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <RefreshCcwIcon className="w-3 h-3" />}
          Refresh
        </button>
        <div className="flex gap-1">
          <button
            className={clsx(
              actionBtnBase,
              showAttach
                ? "bg-slate-200 text-slate-900 ring-1 ring-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
            onClick={() => {
              setShowAttach((v) => !v);
              setShowCreate(false);
            }}
          >
            <Link2Icon className="w-3 h-3" /> Attach
          </button>
          <button
            className={clsx(
              actionBtnBase,
              showCreate
                ? "bg-slate-200 text-slate-900 ring-1 ring-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
            onClick={() => {
              setShowCreate((v) => !v);
              setShowAttach(false);
            }}
          >
            <PlusIcon className="w-3 h-3" /> Create
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error === "no-connection" && (
        <div className="px-3 py-2 mb-3 text-sm text-yellow-700 border border-yellow-300 rounded-md bg-yellow-50 dark:text-yellow-200 dark:border-yellow-700 dark:bg-yellow-900/30">
          Jira integration is not connected for this group.
        </div>
      )}
      {error === "failed" && (
        <div className="px-3 py-2 mb-3 text-sm border rounded-md border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
          Failed to load Jira issues. Please try again.
        </div>
      )}

      {/* Attach Form */}
      {showAttach && (
        <div className="p-3 mb-3 border rounded-lg shadow-sm border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <input
              value={attachKey}
              onChange={(e) => setAttachKey(e.target.value)}
              placeholder="Jira issue key"
              className="flex-1 px-3 py-2 text-sm bg-white border rounded-md text-slate-800 border-slate-300 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
            />
            <PrimaryButton
              onClick={async () => {
                try {
                  await attachJiraIssue(groupId, testCaseId, attachKey);
                  notify?.("success", "Issue attached");
                  setAttachKey("");
                  setShowAttach(false);
                  loadIssues();
                } catch {
                  notify?.("error", "Failed to attach issue");
                }
              }}
              className="text-xs px-3 py-1.5"
            >
              Attach
            </PrimaryButton>
            <PrimaryButton
              onClick={() => setShowAttach(false)}
              className="text-xs px-3 py-1.5"
            >
              Cancel
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="p-4 space-y-4 border rounded-lg shadow-sm border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 animate-fadeIn">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Create Jira Ticket</h3>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Enter summary"
            className="w-full px-3 py-2 text-sm bg-white border rounded-md text-slate-800 border-slate-300 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-2 py-2 text-xs bg-white border rounded-md text-slate-800 border-slate-300 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
            >
              {issueTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2 py-2 text-xs bg-white border rounded-md text-slate-800 border-slate-300 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
            >
              <option>Highest</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
              <option>Lowest</option>
            </select>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Markdown supported. Use ``` for code."
            className="w-full rounded-md border px-3 py-2 text-sm bg-white text-slate-800 border-slate-300 
            dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 resize-y min-h-[100px]"
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={async (e) => {
              if (!e.target.files) return;
              const files = Array.from(e.target.files);
              const converted = await Promise.all(
                files.map(async (f) => ({
                  name: f.name,
                  contentBase64: await fileToBase64(f),
                }))
              );
              setAttachments(converted);
              e.target.value = "";
            }}
          />

          <PrimaryButton
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-3 py-1.5"
          >
            Choose Files
          </PrimaryButton>
          {attachments.length > 0 && (
            <ul className="p-2 mt-2 overflow-auto text-xs bg-white border rounded-md text-slate-800 border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 max-h-32">
              {attachments.map((att, idx) => (
                <li key={idx} className="flex items-center justify-between py-1">
                  <span className="truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-rose-500 hover:underline dark:text-rose-400"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <PrimaryButton onClick={() => setShowCreate(false)} className="text-xs px-3 py-1.5">
              Cancel
            </PrimaryButton>
            <PrimaryButton
              onClick={async () => {
                try {
                  await createJiraIssue(groupId, testCaseId, {
                    summary,
                    issueType,
                    description,
                    priority,
                    attachments,
                  });
                  notify?.("success", "Issue created");
                  setSummary("");
                  setDescription("Created from TMS");
                  setPriority("Medium");
                  setAttachments([]);
                  setShowCreate(false);
                  loadIssues();
                } catch {
                  notify?.("error", "Failed to create issue");
                }
              }}
              className="text-xs px-3 py-1.5"
            >
              Create
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Issues List */}
      {loading ? (
        <div className="mt-3 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-full h-10 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">No issues linked.</div>
      ) : (
        <div className="mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/40">
                <th className="w-24 px-3 py-2 text-left">Key</th>
                <th className="w-48 px-3 py-2 text-left">Summary</th>
                <th className="px-3 py-2 text-left w-44">Status</th>
                <th className="px-3 py-2 text-left w-28">Priority</th>
                <th className="px-3 py-2 text-left w-28">Attachments</th>
                <th className="w-16 px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {issues.map((iss) => (
                <>
                  <tr
                    key={iss.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onMouseEnter={() => setHoveredIssue(iss)}
                    onMouseLeave={() => setHoveredIssue(null)}
                  >
                    <td className="px-3 py-2 font-semibold truncate">
                      <a
                        href={iss.issueUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-slate-800 dark:text-slate-200 hover:underline"
                      >
                        {iss.issueKey}
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-3 py-2 truncate text-slate-700 dark:text-slate-300">
                      {iss.summary || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={iss.status} />
                    </td>
                    <td className="px-3 py-2">
                      <PriorityBadge priority={iss.priority} />
                    </td>
                    <td className="px-3 py-2">
                      {iss.attachments?.length ? (
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border rounded-md text-sky-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-sky-400 dark:hover:bg-slate-800"
                          onClick={() =>
                            setOpenAttachmentsFor(openAttachmentsFor === iss.id ? null : iss.id)
                          }
                        >
                          <PaperclipIcon className="w-3 h-3" />
                          {iss.attachments.length}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={async () => {
                          try {
                            await detachJiraIssue(iss.id);
                            notify?.("success", "Issue unlinked");
                            loadIssues();
                          } catch {
                            notify?.("error", "Failed to unlink issue");
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {openAttachmentsFor === iss.id && (
                    <tr>
                      <td colSpan={6} className="bg-slate-50 dark:bg-slate-900/40">
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Attachments
                            </span>
                            <button
                              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                              onClick={() => setOpenAttachmentsFor(null)}
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <ul className="grid gap-2 overflow-auto sm:grid-cols-2 max-h-40">
                            {iss.attachments?.map((att, idx) => (
                              <li key={idx}>
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100 text-sky-700 dark:hover:bg-slate-800 dark:text-sky-400"
                                >
                                  <PaperclipIcon className="w-3 h-3" />
                                  <span className="text-xs truncate">{att.name}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {/* Hover Preview */}
          {hoveredIssue && (
            <div className="p-4 mt-4 text-sm bg-white border rounded-lg shadow border-slate-200 dark:border-slate-700 dark:bg-slate-900 animate-fadeIn">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {hoveredIssue.issueKey} — {hoveredIssue.summary || "—"}
              </p>
              <div className="mt-2 overflow-y-auto prose-sm prose dark:prose-invert max-h-48">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {hoveredIssue.description || "—"}
                </ReactMarkdown>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <StatusBadge status={hoveredIssue.status} />
                <PriorityBadge priority={hoveredIssue.priority} />
              </div>
              {hoveredIssue.author && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Author: {hoveredIssue.author}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
