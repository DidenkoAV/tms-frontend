// src/pages/ProjectOverviewPage.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { http } from "@/lib/http";

// Entities (new structure)
import { listAllProjects } from "@/entities/project";
import type { Project } from "@/entities/project";
import { listRuns, listRunCases } from "@/entities/test-run";
import type { Run } from "@/entities/test-run";
import { STATUS_ID } from "@/entities/test-result";
import { listMilestones } from "@/entities/milestone";
import type { Milestone } from "@/entities/milestone";

// editor helpers
import {
  htmlToMd,
  markdownToHtml,
  placeCaretAtEnd,
  getClosestBlock,
  getClosestInSelection,
} from "@/shared/utils/editorHelpers";

type Suite = { id: number };
type TCase = { id: number };

/* ---------- tiny icons ---------- */
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 17.25V21h3.75L18.5 9.25l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.75 5.5L18.5 9.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconBold(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M7 5h6a3 3 0 010 6H7zM7 11h7a3 3 0 010 6H7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function IconItalic(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M10 5h8M6 19h8M14 5l-4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>)}
function IconH1(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 6v12M12 6v12M4 12h8M18 6v12" stroke="currentColor" strokeWidth="1.6"/></svg>)}
function IconList(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 6h12M9 12h12M9 18h12" stroke="currentColor" strokeWidth="1.6"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>)}
function IconCode(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 18L3 12l6-6M15 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function IconLink(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M10 13a5 5 0 007 0l1-1a5 5 0 00-7-7l-1 1" stroke="currentColor" strokeWidth="1.6"/><path d="M14 11a5 5 0 01-7 0l-1-1" stroke="currentColor" strokeWidth="1.6"/></svg>)}
function IconImage(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 17l4-4 3 3 3-2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function IconArrow(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 5h10v10M4 20L19 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)}

/* ---------- local atoms ---------- */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1524] ${className}`}>
      {children}
    </section>
  );
}

function ButtonNeutral({
  children,
  onClick,
  type = "button",
  asLink = false,
  to,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  asLink?: boolean;
  to?: string;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm leading-none transition-all " +
    "border-slate-300 text-slate-800 bg-white/80 hover:bg-white hover:shadow-sm hover:-translate-y-0.5 hover:border-slate-400 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 active:translate-y-0 " +
    "dark:border-slate-700 dark:text-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:focus-visible:ring-violet-400/30";
  if (asLink && to) return <Link to={to} className={base}>{children}</Link>;
  return <button type={type} onClick={onClick} className={base}>{children}</button>;
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[12px] text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
      {children}
    </span>
  );
}

export default function ProjectOverviewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const projectId = Number(id ?? NaN);

  const [project, setProject] = useState<Project | null>(null);
  const [suitesCount, setSuitesCount] = useState<number>(0);
  const [casesCount, setCasesCount] = useState<number>(0);

  const [runs, setRuns] = useState<Run[]>([]);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [lastRunPassRate, setLastRunPassRate] = useState<number | null>(null);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [nextDue, setNextDue] = useState<Milestone | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editingDesc, setEditingDesc] = useState(false);
  const [md, setMd] = useState("");
  const rtfRef = useRef<HTMLDivElement | null>(null);

  const [boldOn, setBoldOn] = useState(false);
  const [italicOn, setItalicOn] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      nav("/projects", { replace: true });
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const all = await listAllProjects();
        const p = all.find(x => x.id === projectId) || null;
        if (!p) { if (alive) nav("/projects", { replace: true }); return; }
        if (!alive) return;
        setProject(p);
        setMd((p as any)?.description || "");

        const [suitesRes, casesRes] = await Promise.all([
          http.get<Suite[]>(`/api/projects/${projectId}/suites`).catch(() => ({ data: [] as Suite[] })),
          http.get<TCase[]>(`/api/projects/${projectId}/cases`).catch(() => ({ data: [] as TCase[] })),
        ]);
        if (!alive) return;
        setSuitesCount(suitesRes.data.length);
        setCasesCount(casesRes.data.length);

        const runsList = await listRuns(projectId);
        if (!alive) return;
        setRuns(runsList);

        if (runsList.length) {
          const pick = pickLastRun(runsList);
          setLastRun(pick);
          try {
            const rcases = await listRunCases(pick.id as number);
            const total = rcases.length;
            const passed = rcases.filter(r => r.currentStatusId === STATUS_ID.PASSED).length;
            setLastRunPassRate(total ? passed / total : 0);
          } catch {
            setLastRunPassRate(null);
          }
        } else {
          setLastRun(null);
          setLastRunPassRate(null);
        }

        const ms = await listMilestones(projectId);
        if (!alive) return;
        setMilestones(ms);

        const upcoming = ms
          .filter(m => !m.archived && m.dueDate)
          .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime());
        setNextDue(upcoming[0] ?? null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load project");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId, nav]);

  useEffect(() => {
    function updateStates() {
      if (!rtfRef.current) return;
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (!rtfRef.current.contains(sel.anchorNode)) return;
      try {
        setBoldOn(document.queryCommandState("bold"));
        setItalicOn(document.queryCommandState("italic"));
      } catch {}
    }
    document.addEventListener("selectionchange", updateStates);
    return () => document.removeEventListener("selectionchange", updateStates);
  }, []);

  const runsCount = runs.length;
  const milestonesCount = milestones.length;

  const overview = useMemo(() => ([
    { label: "Suites", value: suitesCount },
    { label: "Cases",  value: casesCount },
    { label: "Runs",   value: runsCount },
    { label: "Milestones", value: milestonesCount },
  ]), [suitesCount, casesCount, runsCount, milestonesCount]);

  if (!Number.isFinite(projectId)) return null;

  const btn =
    "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm " +
    "border-slate-300 bg-white/70 text-slate-700 hover:bg-white hover:shadow-sm hover:border-slate-400 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 " +
    "dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:focus-visible:ring-violet-400/30";

  const btnPrimary =
    "rounded-xl bg-sky-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:brightness-[1.05] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 " +
    "dark:bg-[#1e4fd6] dark:focus-visible:ring-violet-400/50";

  function openEditor() {
    setEditingDesc(true);
    requestAnimationFrame(() => {
      if (!rtfRef.current) return;
      rtfRef.current.innerHTML = md ? markdownToHtml(md) : "";
      placeCaretAtEnd(rtfRef.current);
    });
  }

  function ensureFocus() {
    if (!rtfRef.current) return false;
    rtfRef.current.focus();
    return true;
  }

  function exec(cmd: string, value?: string) {
    try { (document as any).execCommand(cmd, false, value); } catch {}
  }

  function toggleBold() { if (!ensureFocus()) return; exec("bold"); try { setBoldOn(document.queryCommandState("bold")); } catch {} }
  function toggleItalic() { if (!ensureFocus()) return; exec("italic"); try { setItalicOn(document.queryCommandState("italic")); } catch {} }

  function toggleHeading1() {
    if (!ensureFocus()) return;
    const blk = getClosestBlock(rtfRef.current!);
    if (blk?.nodeName === "H1") exec("formatBlock", "P"); else exec("formatBlock", "H1");
  }

  function toggleBulletedList() {
    if (!ensureFocus()) return;
    exec("insertUnorderedList");
  }

  function insertOrWrapCode() {
    if (!ensureFocus()) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = sel.toString();
    const hasNewline = selectedText.includes("\n");

    if (selectedText) {
      if (hasNewline) {
        const pre = document.createElement("pre");
        pre.className =
          "p-3 overflow-auto bg-white border rounded-lg border-slate-300 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
        const code = document.createElement("code");
        code.textContent = selectedText;
        pre.appendChild(code);
        range.deleteContents();
        range.insertNode(pre);
        sel.removeAllRanges();
        const r = document.createRange();
        r.selectNode(pre);
        r.collapse(false);
        sel.addRange(r);
      } else {
        const code = document.createElement("code");
        code.textContent = selectedText;
        code.className = "rounded bg-slate-100 px-1 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
        range.deleteContents();
        range.insertNode(code);
        sel.removeAllRanges();
        const r = document.createRange();
        r.selectNodeContents(code);
        r.collapse(false);
        sel.addRange(r);
      }
    } else {
      const code = document.createElement("code");
      code.className = "rounded bg-slate-100 px-1 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
      code.innerHTML = "\u200B";
      range.insertNode(code);
      range.setStart(code.firstChild as Text, 1);
      range.setEnd(code.firstChild as Text, 1);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function insertLink() {
    if (!ensureFocus()) return;
    const url = window.prompt("Enter URL");
    if (!url) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.toString()) {
      exec("createLink", url);
      const a = getClosestInSelection("A");
      if (a) { a.setAttribute("target", "_blank"); a.classList.add("underline","text-slate-700","dark:text-slate-200"); }
    } else {
      const range = sel.getRangeAt(0);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.textContent = url;
      a.className = "underline text-slate-700 dark:text-slate-200";
      range.insertNode(a);
      range.setStartAfter(a);
      range.setEndAfter(a);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function insertImage() {
    if (!ensureFocus()) return;
    const url = window.prompt("Image URL");
    if (!url) return;
    const alt = window.prompt("Alt text (optional)") || "";
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const img = document.createElement("img");
    img.src = url;
    if (alt) img.alt = alt;
    img.className = "max-w-full my-2 border rounded border-slate-300 dark:border-slate-700";
    range.insertNode(img);
    range.setStartAfter(img);
    range.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => nav("/projects")} className="mb-1 text-xs text-slate-500 hover:underline dark:text-slate-400">
            ← Back to projects
          </button>
          <h1 className="text-2xl font-semibold">
          Project details
          </h1>
        </div>
        {lastRun && (
          <div className="items-center hidden gap-2 sm:flex">
            <Pill>Last run: <b className="text-slate-800 dark:text-slate-100">{lastRun.name}</b></Pill>
            <Pill>Pass rate: <b className="text-slate-800 dark:text-slate-100">{lastRunPassRate == null ? "—" : Math.round(lastRunPassRate*100)+"%"}</b></Pill>
          </div>
        )}
      </div>

      {err && (
        <div className="px-3 py-2 mb-6 text-sm border rounded-xl border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {err}
        </div>
      )}

      {/* ===== Description card ===== */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">Project description</div>
          {!editingDesc ? (
            <button className={btn} onClick={openEditor} title="Edit description">
              <IconEdit /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className={btnPrimary}
                onClick={async () => {
                  try {
                    const html = rtfRef.current ? rtfRef.current.innerHTML : "";
                    const mdToSend = htmlToMd(html);
                    const { data } = await http.patch<Project>(`/api/projects/${projectId}`, { description: mdToSend });
                    setMd(mdToSend);
                    setProject(data);
                    setEditingDesc(false);
                  } catch (e: any) {
                    alert(e?.response?.data?.message || "Failed to save description");
                  }
                }}
              >
                Save
              </button>
              <button className={btn} onClick={() => setEditingDesc(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingDesc ? (
          <MarkdownView markdown={md} />
        ) : (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button type="button" onClick={toggleBold} className={btn} title="Bold"><IconBold /> Bold</button>
              <button type="button" onClick={toggleItalic} className={btn} title="Italic"><IconItalic /> Italic</button>
              <button type="button" onClick={toggleHeading1} className={btn} title="Heading 1"><IconH1 /> H1</button>
              <button type="button" onClick={toggleBulletedList} className={btn} title="Bulleted list"><IconList /> List</button>
              <button type="button" onClick={insertOrWrapCode} className={btn} title="Code"><IconCode /> Code</button>
              <button type="button" onClick={insertLink} className={btn} title="Insert link"><IconLink /> Link</button>
              <button type="button" onClick={insertImage} className={btn} title="Insert image"><IconImage /> Image</button>
            </div>

            <div
              ref={rtfRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => { if (rtfRef.current) setMd(htmlToMd(rtfRef.current.innerHTML)); }}
              className="mt-2 h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-[#0b1222] dark:text-slate-200"
            />
          </div>
        )}
      </Card>

      {/* ---- Project overview (Statistics - non-interactive) ---- */}
      <Card className="mb-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/20">
        <div className="mb-4 flex items-center gap-2">
          <div className="text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">
            Project Statistics
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">(read-only)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overview.map((it) => (
            <div
              key={it.label}
              className="rounded-lg border border-slate-200/60 bg-white/60 p-4 dark:border-slate-700/40 dark:bg-slate-800/30"
            >
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {it.label}
              </div>
              <div className="mt-2 text-4xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {it.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ---- Navigation Cards (Interactive - clickable) ---- */}
      <div className="mb-3">
        <div className="text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">
          🔗 Quick Navigation
        </div>
      </div>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Test Cases */}
        <Link
          to={`/projects/${projectId}/test-cases`}
          className="group relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0b1222] dark:hover:border-slate-100 dark:hover:bg-slate-800/50"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white">
              Test Cases
            </h3>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-400 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-all group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:border-slate-100 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
              <IconArrow /> Open
            </span>
          </div>
          <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Pill>Suites: <b>{suitesCount}</b></Pill>
            <Pill>Cases: <b>{casesCount}</b></Pill>
          </div>
          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-slate-900 transition-all duration-300 group-hover:w-full dark:bg-slate-100" />
        </Link>

        {/* Test Runs */}
        <Link
          to={`/projects/${projectId}/runs`}
          className="group relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0b1222] dark:hover:border-slate-100 dark:hover:bg-slate-800/50"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white">
              Test Runs
            </h3>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-400 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-all group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:border-slate-100 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
              <IconArrow /> Open
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Pill>Runs: <b>{runsCount}</b></Pill>
            <Pill>Last: <b>{lastRun ? lastRun.name : "—"}</b></Pill>
          </div>
          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-slate-900 transition-all duration-300 group-hover:w-full dark:bg-slate-100" />
        </Link>

        {/* Milestones */}
        <Link
          to={`/projects/${projectId}/milestones`}
          className="group relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0b1222] dark:hover:border-slate-100 dark:hover:bg-slate-800/50"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-slate-100 dark:group-hover:text-white">
              Milestones
            </h3>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-400 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-all group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:border-slate-100 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900">
              <IconArrow /> Open
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Pill>Total: <b>{milestonesCount}</b></Pill>
            <Pill>
              Next due: <b>{nextDue?.dueDate ? new Date(nextDue.dueDate).toLocaleDateString() : "—"}</b>
            </Pill>
          </div>
          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-slate-900 transition-all duration-300 group-hover:w-full dark:bg-slate-100" />
        </Link>
      </section>
    </div>
  );
}

function pickLastRun(runs: Run[]): Run {
  const withDate = runs.filter((r: any) => (r as any).createdAt);
  if (withDate.length) {
    return [...runs].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }
  return [...runs].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
}

function MarkdownView({ markdown }: { markdown: string }) {
  const html = markdownToHtml(markdown);
  return <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

