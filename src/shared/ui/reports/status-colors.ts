// src/ui/reports/status-colors.ts
export type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";

export const STATUS_ORDER: StatusKey[] = [
  "PASSED",
  "RETEST",
  "FAILED",
  "SKIPPED",
  "BROKEN",
];

export const STATUS_LABEL: Record<StatusKey, string> = {
  PASSED: "Passed",
  RETEST: "Retest",
  FAILED: "Failed",
  SKIPPED: "Skipped",
  BROKEN: "Broken",
};

// Tracks (background rings)
export const TRACK = {
  light: "#F1F5F9", // slate-100/200 mix
  dark: "#0F1524",  // deep dark background
};

// Status palette (light/dark). In dark - more muted tones.
export const STATUS_COLORS: Record<
  StatusKey,
  { light: string; dark: string }
> = {
  // Was 'acidic' - made soft emerald with less saturation.
  PASSED: { light: "#22C55E", dark: "#1F9D78" }, // ← new dark green

  // Slightly muted others to maintain balance
  RETEST: { light: "#F59E0B", dark: "#D28C1E" },
  FAILED: { light: "#EF4444", dark: "#E15562" },
  SKIPPED: { light: "#0EA5E9", dark: "#2A9ED3" },
  BROKEN: { light: "#64748B", dark: "#818896" },
};

// Theme detection utility
export function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}
