/* ========== HTML/MD conversions ========== */
function decodeHtmlEntities(s: string) {
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

function stripTags(s: string) {
  return s.replace(/<\/?[^>]+>/g, "");
}

export function htmlToMd(html: string): string {
  let s = html || "";
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_m, code) => "```\n" + decodeHtmlEntities(code) + "\n```");
  s = s.replace(/<(div|p)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `${stripTags(inner).trim()}\n\n`);
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `# ${stripTags(t).trim()}\n\n`);
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `## ${stripTags(t).trim()}\n\n`);
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `### ${stripTags(t).trim()}\n\n`);
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) =>
    "\n" + inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_mm, li) => `- ${stripTags(li).trim()}\n`) + "\n"
  );
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `**${stripTags(inner).trim()}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `_${stripTags(inner).trim()}_`);
  s = s.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => `[${stripTags(text)}](${href})`);
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, t) => "`" + stripTags(t).trim() + "`");
  s = s.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*\/?>/gi, (_m, alt, src) => `![${alt}](${src})`);
  s = s.replace(/<\/?[^>]+>/g, "");
  s = decodeHtmlEntities(s).replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function markdownToHtml(md: string): string {
  let html = escapeHtml(md || "_No description yet._");
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="rounded-lg border border-slate-300 bg-slate-50 p-3 overflow-auto dark:border-slate-700 dark:bg-slate-900"><code>${escapeHtml(code)}</code></pre>`);
  html = html.replace(/^### (.*)$/gm, "<h3 class='text-lg font-semibold mt-3'>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2 class='text-xl font-semibold mt-4'>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1 class='text-2xl font-semibold mt-4'>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code class='rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800'>$1</code>");
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<img src='$2' alt='$1' class='my-2 max-w-full rounded border border-slate-300 dark:border-slate-700'/>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => `<a href="${href}" class="text-sky-600 underline dark:text-cyan-300" target="_blank" rel="noreferrer">${text}</a>`);
  html = html.replace(/^(?:- .+(?:\n|$))+?/gm, (block) => {
    const items = block.trim().split("\n").map(l => l.replace(/^- /,"").trim()).map(li => `<li class="my-0.5">${li}</li>`).join("");
    return `<ul class="list-disc pl-5 my-2">${items}</ul>`;
  });
  html = html.split(/\n{2,}/).map(p => (/^<h\d|^<ul|^<pre|^<img/.test(p.trim()) ? p : `<p class="my-2 leading-6">${p.replace(/\n/g,"<br/>")}</p>`)).join("");
  return html;
}

/* ========== Caret helper ========== */
export function placeCaretAtEnd(el: HTMLElement) {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ========== Selection helpers ========== */
export function getClosestBlock(root: HTMLElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  let node: Node | null = sel.anchorNode;
  if (!node) return null;
  if (node.nodeType === 3) node = node.parentNode; // text → parent

  while (node && node instanceof HTMLElement && node !== root) {
    const tag = node.tagName;
    if (/^(H1|H2|H3|P|DIV|LI)$/.test(tag)) return node;
    node = node.parentElement;
  }
  return root;
}

export function getClosestInSelection(tagName: string): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  let node: Node | null = sel.anchorNode;
  if (!node) return null;
  if (node.nodeType === 3) node = node.parentNode; // text → parent

  while (node && node instanceof HTMLElement) {
    if (node.tagName === tagName.toUpperCase()) return node;
    node = node.parentElement;
  }
  return null;
}
