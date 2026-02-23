// src/features/runs/components/RunComments.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { listResults, addResult, deleteResultsBulk } from "@/entities/test-result";
import { useConfirm } from "@/shared/ui/alert";
import { MarkdownBlock } from "@/shared/ui/markdown/TinyMarkdown";
import RunStatusPicker, { RunStatusBadge } from "@/shared/ui/table/RunStatusPicker";
import { RESULT_CHOICES } from "@/entities/test-result";
import { SortIcon } from "@/shared/ui/icons";

type Props = {
  runId: number;
  caseId: number;
  refreshTick?: number;
  onStatusChange: (id: number) => void;
  notify?: (kind: "info" | "error" | "success" | "warning", text: string) => void;
};

export default function RunComments({
  runId, caseId, refreshTick = 0, onStatusChange, notify,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listResults>>>([]);
  const [text, setText] = useState("");
  const [statusId, setStatusId] = useState<number>(RESULT_CHOICES[0].id);

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const confirm = useConfirm();

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sortDir === "desc" ? copy : copy.reverse();
  }, [rows, sortDir]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(r => (r.comment || "").toLowerCase().includes(q));
  }, [sorted, query]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [filtered.length, query, sortDir]);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listResults(runId, caseId);
      setRows(data);
      const last = data[0];
      if (last?.statusId) setStatusId(last.statusId);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [runId, caseId]);
  useEffect(() => { reload(); }, [refreshTick]);

  async function submit() {
    const comment = text.trim();
    if (!comment) return;
    try {
      await addResult(runId, caseId, { statusId, comment });
      await reload();
      setText("");
      setQuery("");
      setPage(1);
      onStatusChange(statusId);
      notify?.("success", "Comment added");
    } catch (e: any) {
      notify?.("error", e?.response?.data?.message || "Failed to add comment");
    }
  }

  /** Clear all comments (results) for current runId + caseId */
  async function cleanHistory() {
    confirm.open(
      "Clear all comments for this case in the run?",
      async () => {
        try {
          const all = await listResults(runId, caseId);
          if (all.length === 0) {
            notify?.("info", "No comments to clear");
            return;
          }

          const ids = all.map(r => r.id);
          await deleteResultsBulk(runId, ids);
          await reload();

          notify?.("info", `Cleared ${ids.length} comment${ids.length > 1 ? "s" : ""}`);
        } catch (e: any) {
          console.error(e);
          setRows([]);
          setPage(1);
          setQuery("");
          notify?.("error", e?.response?.data?.message || "Failed to clear comments");
        }
      },
      { title: "Confirm", okText: "OK", cancelText: "Cancel", danger: true }
    );
  }

  const section =
    "rounded-2xl border p-5 border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1524]";
  const btnBase = "inline-flex items-center rounded-2xl border transition";
  const btnSm = "px-3 py-1.5 text-sm";
  const btnGhost =
    "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500";
  const toolBtn =
    "inline-flex items-center rounded-xl border px-2 py-1 text-xs border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500";

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function mdWrap(prefix: string, suffix = "") {
    const el = taRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const before = value.slice(0, s);
    const selected = value.slice(s, e);
    const after = value.slice(e);
    const next = `${before}${prefix}${selected || ""}${suffix}${after}`;
    setText(next);
    const caret = (before + prefix + selected + suffix).length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function mdLinePrefix(prefix: string) {
    const el = taRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const start = value.lastIndexOf("\n", s - 1) + 1;
    const end = value.indexOf("\n", e);
    const realEnd = end === -1 ? value.length : end;
    const block = value.slice(start, realEnd);
    const transformed = block
      .split("\n")
      .map(l => (l ? `${prefix}${l}` : l))
      .join("\n");
    const next = value.slice(0, start) + transformed + value.slice(realEnd);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + transformed.length);
    });
  }

  function mdLink(image = false) {
    const url = prompt(image ? "Image URL" : "Link URL");
    if (!url) return;
    const el = taRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || (image ? "alt" : "text");
    const md = image ? `![${selected}](${url})` : `[${selected}](${url})`;
    const next = value.slice(0, s) + md + value.slice(e);
    setText(next);
    const caret = s + md.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <section className={section}>
      {/* Header: search + sort + clear */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in comments..."
            className="w-full sm:w-96 rounded-2xl border px-3 py-1.5 text-sm outline-none
                       border-slate-300 bg-white text-slate-800 placeholder:text-slate-400
                       focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900
                       dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
          />

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className={toolBtn + " justify-center w-9 h-9"}
              title={sortDir === "desc" ? "Newest first" : "Oldest first"}
              aria-label="Toggle sort"
            >
              <SortIcon className={sortDir === "asc" ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            <button
              onClick={cleanHistory}
              className={toolBtn + " h-9 px-3"}
              title="Clear comments"
            >
              Clear comments
            </button>
          </div>
        </div>

        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700 dark:text-slate-300">
          Run comments
          <span className="ml-2 rounded-2xl border border-slate-200 px-2 py-1 text-[11px] text-slate-500
                           dark:border-slate-700 dark:text-slate-400">
            Run ID {runId}
          </span>
        </h2>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <RunStatusPicker valueId={statusId} onChange={setStatusId} />
        <div className="flex flex-wrap items-center gap-1 ml-auto">
          <EditorBtn onClick={() => mdWrap("**","**")} title="Bold">B</EditorBtn>
          <EditorBtn onClick={() => mdWrap("*","*")} title="Italic"><span className="italic">I</span></EditorBtn>
          <EditorBtn onClick={() => mdWrap("`","`")} title="Inline code">{`</>`}</EditorBtn>
          <EditorBtn onClick={() => mdWrap("```\n","\n```")} title="Code block">Code</EditorBtn>
          <EditorBtn onClick={() => mdLinePrefix("# ")} title="H1">H1</EditorBtn>
          <EditorBtn onClick={() => mdLinePrefix("## ")} title="H2">H2</EditorBtn>
          <EditorBtn onClick={() => mdLinePrefix("- ")} title="Bulleted list">• List</EditorBtn>
          <EditorBtn onClick={() => mdLinePrefix("1. ")} title="Numbered list">1.</EditorBtn>
          <EditorBtn onClick={() => mdLinePrefix("> ")} title="Quote">&raquo;</EditorBtn>
          <EditorBtn onClick={() => mdLink(false)} title="Link">🔗</EditorBtn>
          <EditorBtn onClick={() => mdLink(true)} title="Image">🖼️</EditorBtn>
        </div>
      </div>

      {/* Editor */}
      <div className="relative mb-6">
        <textarea
          ref={taRef}
          className="min-h-[220px] w-full resize-y rounded-2xl border p-3 pr-40 pb-14 outline-none
                     border-slate-300 bg-white text-slate-800 placeholder:text-slate-400
                     focus:border-slate-400 dark:border-slate-800 dark:bg-[#0b1222]
                     dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
          placeholder="Add comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm
                     border-slate-300 bg-white text-slate-800 hover:border-slate-400 disabled:opacity-60
                     dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
          title="Add comment"
        >
          <span>Add comment</span>
        </button>
      </div>

      {err && (
        <div className="px-3 py-2 mb-3 text-sm border rounded-2xl border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-200">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : (
        <>
          <div className="space-y-3">
            {pageRows.map(r => (
              <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0b1222]">
                <header className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    #{r.id}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                  <RunStatusBadge id={r.statusId} />
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                    {r.elapsedSeconds ? `${r.elapsedSeconds}s` : "—"}
                  </span>
                </header>
                <div className="text-sm leading-6 text-slate-800 dark:text-slate-200 [word-break:break-word]">
                  <MarkdownBlock text={r.comment || ""} />
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="text-slate-500 dark:text-slate-400">
              Page {page} / {Math.max(1, Math.ceil(filtered.length / 10))}
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                className={[btnBase, btnSm, btnGhost, "px-2"].join(" ")}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >Prev</button>
              {Array.from({ length: Math.max(1, Math.ceil(filtered.length / 10)) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={[
                    "inline-flex items-center rounded-2xl px-2 py-1 text-sm",
                    n === page
                      ? "border-slate-400 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                  ].join(" ")}
                  onClick={() => setPage(n)}
                >{n}</button>
              ))}
              <button
                className={[btnBase, btnSm, btnGhost, "px-2"].join(" ")}
                disabled={page >= Math.max(1, Math.ceil(filtered.length / 10))}
                onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(filtered.length / 10)), p + 1))}
              >Next</button>
            </div>
          </div>
        </>
      )}
      {confirm.ui}
    </section>
  );
}

function EditorBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center px-2 py-1 text-xs bg-white border rounded-xl border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
    >
      {children}
    </button>
  );
}
