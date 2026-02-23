// src/features/runs/types.ts

export type Run = {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  closed: boolean;
  archived: boolean;

  // NEW (for displaying author)
  createdBy: number | null;
  createdByName?: string | null;
  createdByEmail?: string | null;

  // (optional, if backend already returns - not required to use on page)
  createdAt?: string;
  updatedAt?: string;
};

export type RunCreate = {
  name: string;
  description?: string;
  closed?: boolean; // optional
};

export type RunUpdate = Partial<Pick<Run, "name" | "description" | "closed">>;

export type RunCase = {
  id: number;
  runId: number;
  caseId: number;
  /** null = Untested (on backend initially currentStatusId=null) */
  currentStatusId: number | null;
  assigneeId: number | null;
  comment: string | null;
};

/** Backend response to bulk run archiving */
export type BulkResultResponse = {
  affected: number;
};
