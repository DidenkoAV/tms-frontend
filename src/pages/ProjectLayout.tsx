// src/pages/ProjectLayout.tsx — menu inside project (light/dark neutral styles)
import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

// Entities (new structure)
import { listAllProjects } from "@/entities/project";
import type { Project } from "@/entities/project";
import { listRuns } from "@/entities/test-run";
import type { Run } from "@/entities/test-run";
import { listCases } from "@/entities/test-case";
import type { TestCase } from "@/entities/test-case";
import { http } from "@/lib/http";

/* tiny icons */
function IconBolt() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
function IconSearch() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function IconFolder() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 7.5A2.5 2.5 0 015.5 5h3l2 2h7A2.5 2.5 0 0120 9.5v7A2.5 2.5 0 0117.5 19h-12A2.5 2.5 0 013 16.5v-9z" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function IconFile() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" strokeWidth="1.6"/><path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function IconPlay() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M7 6v12l10-6-10-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
function IconX() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>); }

/* small atoms to keep consistency */
function SegTabs({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-sm dark:border-slate-800 dark:bg-[#0b1222]">
      {children}
    </div>
  );
}
function segLink(isActive: boolean) {
  const base = "rounded-lg px-3 py-1.5 transition";
  return isActive
    ? `${base} bg-slate-900 text-white dark:bg-white dark:text-slate-900`
    : `${base} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`;
}

/* ----- types for palette items ----- */
type Suite = { id: number; name: string };

export default function ProjectLayout() {
  const { id } = useParams();
  const projectId = Number(id ?? NaN);
  const nav = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // data for Jump palette
  const [suites, setSuites] = useState<Suite[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) { nav("/projects", { replace: true }); return; }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // project itself
        const all = await listAllProjects();
        const p = all.find(x => x.id === projectId) || null;
        if (!p) { if (alive) nav("/projects", { replace: true }); return; }
        if (!alive) return;
        setProject(p);

        // quick lists for palette
        const [suitesRes, casesRes, runsRes] = await Promise.all([
          http.get<Suite[]>(`/api/projects/${projectId}/suites`).then(r => r.data).catch(()=>[]),
          listCases(projectId, { size: 0 }).catch(()=>[] as TestCase[]),
          listRuns(projectId).catch(()=>[] as Run[]),
        ]);
        if (!alive) return;
        setSuites(suitesRes);
        setCases(casesRes);
        setRuns(runsRes);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId, nav]);

  // hotkey for Jump
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setJumpOpen(v => !v);
      }
      if (e.key === "Escape") setJumpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback((path: string) => {
    setJumpOpen(false);
    setQ("");
    nav(path);
  }, [nav]);

  const qLower = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!qLower) return { suites, cases, runs };
    const f = <T extends { [k: string]: any }>(arr: T[], pick: (x: T) => string) =>
      arr.filter(x => pick(x).toLowerCase().includes(qLower));
    return {
      suites: f(suites, s => s.name || `Suite #${s.id}`),
      cases:  f(cases,  c => c.title || `Case #${c.id}`),
      runs:   f(runs,   r => r.name || `Run #${r.id}`),
    };
  }, [qLower, suites, cases, runs]);

  if (!Number.isFinite(projectId)) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 text-slate-900 dark:text-slate-100">
      {/* sticky project scope bar */}
      <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#0f1524]/95">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {project?.name || (loading ? "Loading…" : "Project")}
                </span>
                <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  ID {projectId}
                </span>
              </div>

              {/* tabs */}
              <div className="mt-2">
                <SegTabs>
                  <NavLink
                    to={`/projects/${projectId}`}
                    end
                    className={({ isActive }) => segLink(isActive)}
                    aria-label="Overview"
                  >
                    Overview
                  </NavLink>
                  <NavLink
                    to={`/projects/${projectId}/test-cases`}
                    className={({ isActive }) => segLink(isActive)}
                    aria-label="Cases"
                  >
                    Cases
                  </NavLink>
                  <NavLink
                    to={`/projects/${projectId}/runs`}
                    className={({ isActive }) => segLink(isActive)}
                    aria-label="Runs"
                  >
                    Runs
                  </NavLink>
                  <NavLink
                    to={`/projects/${projectId}/milestones`}
                    className={({ isActive }) => segLink(isActive)}
                    aria-label="Milestones"
                  >
                    Milestones
                  </NavLink>
                </SegTabs>
              </div>
            </div>

            {/* Jump button intentionally hidden; palette opens by ⌘/Ctrl + K */}
          </div>
        </div>
      </div>

      {/* child page */}
      <Outlet />

      {/* Command palette (⌘/Ctrl + K) */}
      {jumpOpen && (
        <div className="fixed inset-0 z-50 grid place-items-start bg-black/50 p-4" onClick={() => setJumpOpen(false)}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-[#0f1524]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                Project {projectId}
              </span>
              <button
                className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-violet-400/30"
                onClick={() => setJumpOpen(false)}
                aria-label="Close"
              >
                <IconX />
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus-within:border-slate-400 dark:border-slate-800 dark:bg-[#0b1222] dark:text-slate-200">
              <IconSearch />
              <input
                autoFocus
                placeholder="Search suites, cases, runs…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                ⌘/Ctrl + K
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Suites */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1"><IconFolder /> Suites</span>
                </div>
                <div className="max-h-64 overflow-auto p-1">
                  {filtered.suites.length === 0 && <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No suites</div>}
                  {filtered.suites.slice(0, 50).map(s => (
                    <button
                      key={s.id}
                      onClick={() => go(`/projects/${projectId}/test-cases?suite=${s.id}`)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span className="truncate">{s.name || `Suite #${s.id}`}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">#{s.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cases */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1"><IconFile /> Cases</span>
                </div>
                <div className="max-h-64 overflow-auto p-1">
                  {filtered.cases.length === 0 && <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No cases</div>}
                  {filtered.cases.slice(0, 50).map(c => (
                    <button
                      key={c.id}
                      onClick={() => go(`/projects/${projectId}/cases/${c.id}`)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span className="truncate">{c.title || `Case #${c.id}`}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">#{c.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Runs */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1"><IconPlay /> Runs</span>
                </div>
                <div className="max-h-64 overflow-auto p-1">
                  {filtered.runs.length === 0 && <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No runs</div>}
                  {filtered.runs.slice(0, 50).map(r => (
                    <button
                      key={r.id}
                      onClick={() => go(`/projects/${projectId}/runs/${r.id}`)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span className="truncate">{r.name || `Run #${r.id}`}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">#{r.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* quick links */}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => go(`/projects/${projectId}`)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:border-slate-700"
              >
                <IconBolt /> Overview
              </button>
              <button
                onClick={() => go(`/projects/${projectId}/test-cases`)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:border-slate-700"
              >
                Cases
              </button>
              <button
                onClick={() => go(`/projects/${projectId}/runs`)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:border-slate-700"
              >
                Runs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
