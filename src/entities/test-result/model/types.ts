// src/features/results/types.ts

/** Keys and numeric IDs of run result statuses (fix from backend) */
export type StatusKey = "PASSED" | "RETEST" | "FAILED" | "SKIPPED" | "BROKEN";

export const STATUS_ID: Record<StatusKey, number> = {
  PASSED: 1,
  RETEST: 2,
  FAILED: 3,
  SKIPPED: 4,
  BROKEN: 5,
};

/** Individual result record for case within run */
export type RunCaseResult = {
  id: number;
  runCaseId: number;
  statusId: number;
  comment: string | null;
  defectsJson: string | null; // can store array/object as JSON string
  elapsedSeconds: number | null;
  createdBy: number | null;
  createdAt: string;          // ISO
};

export type RunCaseResultCreate = {
  statusId: number;            
  comment?: string;
  defectsJson?: string;
  elapsedSeconds?: number;
};


export const STATUS_LABEL: Record<StatusKey, string> = {
  PASSED: "Passed",
  RETEST: "Retest",
  FAILED: "Failed",
  SKIPPED: "Skipped",
  BROKEN: "Broken",
};
