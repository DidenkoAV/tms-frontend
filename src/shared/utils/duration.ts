export function parseDuration(text: string): number | null {
  const s = (text || "").trim();
  if (!s) return null;
  const re = /(\d+(?:\.\d+)?)\s*(w|d|h|m|s)/gi;
  let m: RegExpExecArray | null; let total = 0; let any = false;
  while ((m = re.exec(s))) {
    any = true;
    const n = parseFloat(m[1]);
    const u = m[2].toLowerCase();
    const mult = u === "w" ? 604800 : u === "d" ? 86400 : u === "h" ? 3600 : u === "m" ? 60 : 1;
    total += Math.round(n * mult);
  }
  if (!any && /^\d+$/.test(s)) return parseInt(s, 10);
  return any ? total : null;
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const units: [string, number][] = [["w", 604800], ["d", 86400], ["h", 3600], ["m", 60], ["s", 1]];
  const parts: string[] = [];
  let remain = seconds;
  for (const [u, mult] of units) {
    if (remain >= mult) {
      const n = Math.floor(remain / mult);
      remain -= n * mult;
      parts.push(`${n}${u}`);
    }
  }
  return parts.join(" ");
}
