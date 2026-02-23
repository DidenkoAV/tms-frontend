// ISO date strings from backend
export type IsoDate = string;

/** Main Milestone model */
export type Milestone = {
  id: number;                    // Always number
  projectId: number;             // Project ID
  name: string;                  // Name
  description: string | null;    // Description (can be empty)
  closed: boolean;
  archived: boolean;
  startDate: IsoDate | null;     // Start date (or null)
  dueDate: IsoDate | null;       // Due date (or null)

  createdBy: number | null;      // Creator ID (can be null)
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt?: IsoDate;
  updatedAt?: IsoDate;
};

/** Create new milestone */
export type MilestoneCreate = {
  name: string;
  description?: string | null;
  startDate?: IsoDate | null;
  dueDate?: IsoDate | null;
};

/** Update milestone (PATCH) */
export type MilestoneUpdate = Partial<{
  name: string;
  description: string | null;
  closed: boolean;
  startDate: IsoDate | null;
  dueDate: IsoDate | null;
}>;

/** Brief info about linked Run */
export type RunSummary = {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  closed: boolean;
  archived: boolean;

  createdBy: number | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt?: IsoDate;
  updatedAt?: IsoDate;
};

/** Payload for adding Runs to milestone */
export type MilestoneAddRunsPayload = {
  runIds: number[];
};
