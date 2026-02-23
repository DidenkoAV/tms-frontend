// src/ui/markdown/TinyMarkdown.tsx
import type { JSX } from "react";

/** Safe HTML escaping */
export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[ch]
  );
}

/** Mini-rendering of inline markdown (bold/italic/`code`/links) to HTML */
export function renderInline(md: string) {
  let html = escapeHtml(md);
  html = html.replace(/`([^`]+)`/g, (_m, g1) => `<code class="rounded bg-slate-800/80 px-1 py-0.5">${escapeHtml(g1)}</code>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    `<a class="text-cyan-600 dark:text-cyan-300 hover:underline" href="$2" target="_blank" rel="noreferrer">$1</a>`
  );
  return html;
}

export function MarkdownBlock({ text }: { text: string }) {
  if (!text) return <p className="text-slate-500">—</p>;

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const out: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ```lang
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      let j = i + 1;
      const buf: string[] = [];
      while (j < lines.length && !/^```/.test(lines[j])) { buf.push(lines[j]); j++; }
      i = Math.min(j + 1, lines.length);
      out.push(
        <pre key={`code-${i}-${out.length}`} className="mb-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] leading-5 dark:border-slate-800 dark:bg-[#0b1222]">
          <code data-lang={lang}>{buf.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // # / ## / ### / ####
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(4, h[1].length + 1); // limit to h4 as before
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      out.push(
        <Tag key={`h-${i}-${out.length}`} className="mb-2 font-semibold text-slate-900 dark:text-slate-200">
          <span dangerouslySetInnerHTML={{ __html: renderInline(h[2]) }} />
        </Tag>
      );
      i++;
      continue;
    }

    // lists
    const ulItem = line.match(/^\s*[-*+]\s+(.*)$/);
    const olItem = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ulItem || olItem) {
      const isOl = !!olItem;
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const m = isOl ? l.match(/^\s*\d+\.\s+(.*)$/) : l.match(/^\s*[-*+]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      out.push(
        isOl ? (
          <ol key={`ol-${i}-${out.length}`} className="mb-3 ml-5 list-decimal space-y-1">
            {items.map((t, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: renderInline(t) }} />)}
          </ol>
        ) : (
          <ul key={`ul-${i}-${out.length}`} className="mb-3 ml-5 list-disc space-y-1">
            {items.map((t, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: renderInline(t) }} />)}
          </ul>
        )
      );
      continue;
    }

    if (line.trim() === "") { i++; continue; }

    // paragraph
    const buf: string[] = [line];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "" && !/^```/.test(lines[j])) { buf.push(lines[j]); j++; }
    i = j;
    out.push(
      <p key={`p-${i}-${out.length}`} className="mb-3 text-slate-800 dark:text-slate-200">
        <span dangerouslySetInnerHTML={{ __html: renderInline(buf.join(" ")) }} />
      </p>
    );
  }

  return <div>{out}</div>;
}

export default MarkdownBlock;
