import { STATUS_ID } from "../model/types";

export type ResultKey = "PASSED" | "RETEST" | "FAILED" | "BLOCKED";

export const RESULT_CHOICES = [
  {
    key: "PASSED", id: STATUS_ID.PASSED, label: "Passed", dot: "bg-emerald-500",
    lightBadge: "ring-1 ring-emerald-300/60 bg-white text-slate-900",
    darkBadge:  "ring-1 ring-emerald-500/25 bg-emerald-400/10 text-emerald-100",
  },
  {
    key: "BLOCKED", id: STATUS_ID.SKIPPED, label: "Blocked", dot: "bg-slate-500",
    lightBadge: "ring-1 ring-slate-300/70 bg-white text-slate-900",
    darkBadge:  "ring-1 ring-slate-500/25 bg-slate-400/10 text-slate-100",
  },
  {
    key: "RETEST", id: STATUS_ID.RETEST, label: "Retest", dot: "bg-amber-500",
    lightBadge: "ring-1 ring-amber-300/60 bg-white text-slate-900",
    darkBadge:  "ring-1 ring-amber-500/25 bg-amber-400/10 text-amber-100",
  },
  {
    key: "FAILED", id: STATUS_ID.FAILED, label: "Failed", dot: "bg-rose-500",
    lightBadge: "ring-1 ring-rose-300/60 bg-white text-slate-900",
    darkBadge:  "ring-1 ring-rose-500/25 bg-rose-400/10 text-rose-100",
  },
] as const;

export type ResultChoice = (typeof RESULT_CHOICES)[number];

export const FIND_META = (id?: number | null): ResultChoice | null =>
  RESULT_CHOICES.find(x => x.id === id) || null;
