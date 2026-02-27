// src/features/jira/components/JiraIssuesBlock.tsx
import { useEffect, useState, useRef, Fragment } from "react";
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

/* --------------------------- Helpers --------------------------- */
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** Smart description formatter for Jira issues */
function FormattedDescription({ description }: { description: string }) {
  if (!description || description === "—") {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-100/50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700">
        <ClockIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">
          No description provided
        </p>
      </div>
    );
  }

  // Parse structured parameters (Company:, Instance:, User:, etc.)
  const lines = description.split('\n');
  const params: Array<{ key: string; value: string }> = [];
  const textLines: string[] = [];

  lines.forEach(line => {
    const match = line.match(/^([A-Z][a-zA-Z\s]*?):\s*(.+)$/);
    if (match) {
      params.push({ key: match[1].trim(), value: match[2].trim() });
    } else if (line.trim()) {
      textLines.push(line);
    }
  });

  return (
    <div className="space-y-4">
      {/* Regular text content with enhanced styling */}
      {textLines.length > 0 && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-900/40 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
            prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-bold
            prose-em:text-slate-600 dark:prose-em:text-slate-400 prose-em:italic
            prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-50 dark:prose-code:bg-pink-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1
            prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-1
            prose-li:text-slate-700 dark:prose-li:text-slate-300
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {textLines.join('\n')}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Structured parameters with premium design */}
      {params.length > 0 && (
        <div className="p-4 space-y-3 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/60 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 dark:border-blue-800/50 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 shadow-sm"></div>
            <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Parameters
            </span>
          </div>
          <div className="grid gap-2.5">
            {params.map((param, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-blue-200/50 dark:border-blue-900/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="inline-flex items-center justify-center min-w-[90px] px-3 py-1.5 text-xs font-extrabold rounded-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
                  {param.key}
                </span>
                <span className="flex-1 py-1.5 text-sm font-mono font-medium text-slate-900 dark:text-slate-100 break-all leading-relaxed">
                  {param.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadIssues() {
    try {
      setError(null);
      setLoading(true);
      const data = await listJiraIssues(groupId, testCaseId);
      // Show all issues, even with null summary/description (same as JiraIssuesInline)
      setIssues(data || []);
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

  const actionBtnBase = "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all";
  const primaryBtn = "text-white hover:opacity-90 shadow-sm";
  const secondaryBtn = "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1524] shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          className={clsx(actionBtnBase, secondaryBtn)}
          onClick={loadIssues}
        >
          {loading ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <RefreshCcwIcon className="w-3 h-3" />}
          Refresh
        </button>
        <div className="flex gap-2">
          <button
            className={clsx(actionBtnBase, showAttach ? primaryBtn : secondaryBtn)}
            style={showAttach ? { backgroundColor: "#7c1a87" } : undefined}
            onClick={() => {
              setShowAttach((v) => !v);
              setShowCreate(false);
            }}
          >
            <Link2Icon className="w-3 h-3" /> Attach
          </button>
          <button
            className={clsx(actionBtnBase, showCreate ? primaryBtn : secondaryBtn)}
            style={showCreate ? { backgroundColor: "#7c1a87" } : undefined}
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
            <button
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
              className={clsx(actionBtnBase, primaryBtn)}
              style={{ backgroundColor: "#7c1a87" }}
            >
              Attach
            </button>
            <button
              onClick={() => setShowAttach(false)}
              className={clsx(actionBtnBase, secondaryBtn)}
            >
              Cancel
            </button>
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

          <button
            onClick={() => fileInputRef.current?.click()}
            className={clsx(actionBtnBase, secondaryBtn)}
          >
            Choose Files
          </button>
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
            <button
              onClick={() => setShowCreate(false)}
              className={clsx(actionBtnBase, secondaryBtn)}
            >
              Cancel
            </button>
            <button
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
              className={clsx(actionBtnBase, primaryBtn)}
              style={{ backgroundColor: "#7c1a87" }}
            >
              Create
            </button>
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
                <th className="w-12 px-3 py-2 text-center"></th>
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
                <Fragment key={iss.id}>
                  <tr
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => setExpandedIssue(expandedIssue === iss.id ? null : iss.id)}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
                        title={expandedIssue === iss.id ? "Hide description" : "Show description"}
                      >
                        {expandedIssue === iss.id ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </td>
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
                    <td className="px-3 py-2">
                      <div className="font-medium truncate text-slate-800 dark:text-slate-100">
                        {iss.summary || "—"}
                      </div>
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
                      <td colSpan={7} className="bg-slate-50 dark:bg-slate-900/40">
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
                  {expandedIssue === iss.id && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <div className="p-6 text-sm bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border-t-2 border-b-2 border-slate-200/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 dark:border-slate-700/80 animate-fadeIn">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 pb-4 border-b-2 border-slate-200/70 dark:border-slate-700/70">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 text-xs font-extrabold rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                                  {iss.issueKey}
                                </span>
                                <StatusBadge status={iss.status} />
                                <PriorityBadge priority={iss.priority} />
                              </div>
                              <h3 className="text-xl font-extrabold leading-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-50 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent drop-shadow-sm">
                                {iss.summary || "—"}
                              </h3>
                            </div>
                            <button
                              onClick={() => setExpandedIssue(null)}
                              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
                              title="Close description"
                            >
                              <XIcon className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Description with smart formatting */}
                          <div className="mt-4 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <FormattedDescription description={iss.description || ""} />
                          </div>

                          {/* Footer - Enhanced */}
                          {iss.author && (
                            <div className="flex items-center gap-3 pt-4 mt-4 border-t-2 border-slate-200/70 dark:border-slate-700/70">
                              <div className="flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg ring-2 ring-purple-200 dark:ring-purple-900/50">
                                {iss.author.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                <span className="font-bold text-slate-900 dark:text-slate-100">Author:</span>{" "}
                                <span className="font-medium">{iss.author}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
