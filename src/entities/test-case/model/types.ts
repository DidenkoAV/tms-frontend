/* ======================================================
 * ===============   CORE DATA TYPES   ==================
 * ====================================================== */

/**
 * Represents an attached file (image, document, log, etc.).
 */
export type Attachment = {
  /** Display name of the attachment (optional). */
  name?: string;

  /** Direct download or preview URL. */
  url: string;

  /** File size in bytes (optional). */
  size?: number;

  /** MIME type of the file (optional). */
  mime?: string;
};

/**
 * A single step within a test case, including its action and expected result.
 */
export type Step = {
  /** Step action or operation to perform. */
  action: string;

  /** Expected result or outcome of this step. */
  expected: string;

  /** Optional notes or clarifications. */
  notes?: string | null;

  /** Optional list of attachments (screenshots, logs, etc.). */
  attachments?: Attachment[];
};

/* ======================================================
 * ===============   ENUM-LIKE TYPES   ==================
 * ====================================================== */

/** Severity level of a test case. */
export type Severity = "TRIVIAL" | "MINOR" | "NORMAL" | "MAJOR" | "CRITICAL";

/** Execution or lifecycle status of a test case. */
export type Status =
  | "DRAFT"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "DEPRECATED"
  | "ARCHIVED";

/** Automation progress indicator. */
export type AutomationStatus = "NOT_AUTOMATED" | "IN_PROGRESS" | "AUTOMATED";

/* ======================================================
 * ===============   MAIN ENTITY TYPES   =================
 * ====================================================== */

/**
 * Represents a full test case entity as returned by the backend.
 */
export type TestCase = {
  id: number;
  projectId: number;
  suiteId: number | null;
  title: string;

  typeId: number;
  priorityId: number;

  estimateSeconds: number | null;
  preconditions: string | null;
  sortIndex: number;
  archived: boolean;

  expectedResult: string | null;
  actualResult: string | null;
  testData: string | null;

  steps: Step[];
  attachments: Attachment[];

  status: Status;
  severity: Severity;
  automationStatus: AutomationStatus;
  tags: string[];

  /** Arbitrary mapping for autotest integration metadata. */
  autotestMapping: Record<string, string>;

  createdAt: string;
  updatedAt: string;

  createdBy?: number | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
};

/**
 * Payload for updating an existing test case (partial PATCH).
 */
export type TestCaseUpdate = Partial<
  Pick<
    TestCase,
    | "title"
    | "typeId"
    | "priorityId"
    | "estimateSeconds"
    | "preconditions"
    | "expectedResult"
    | "actualResult"
    | "testData"
    | "steps"
    | "attachments"
    | "status"
    | "severity"
    | "automationStatus"
    | "tags"
    | "suiteId"
    | "autotestMapping"
  >
>;

/* ======================================================
 * ===============   IMPORT / EXPORT TYPES   =============
 * ====================================================== */

/**
 * Represents the result of a test case import operation.
 */
export type ImportTestCasesResponse = {
  /** Number of new test cases successfully imported. */
  imported: number;

  /** Number of existing test cases skipped (duplicates). */
  skipped: number;

  /** Number of existing test cases updated (if overwriteExisting = true). */
  updated: number;
};

/* ======================================================
 * ===============   UI LABEL MAPPINGS   =================
 * ====================================================== */

/** Human-readable labels for priority levels. */
export type PriorityLabel = "Low" | "Medium" | "High" | "Critical";

export const PRIORITY_ID_TO_LABEL: Record<number, PriorityLabel> = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

export const PRIORITY_LABEL_TO_ID: Record<PriorityLabel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

/** Human-readable labels for case types. */
export type CaseTypeLabel =
  | "Functional"
  | "Regression"
  | "Smoke"
  | "Security"
  | "Performance"
  | "Other";

export const TYPE_ID_TO_LABEL: Record<number, CaseTypeLabel> = {
  1: "Functional",
  2: "Regression",
  3: "Smoke",
  4: "Security",
  5: "Performance",
  6: "Other",
};

export const TYPE_LABEL_TO_ID: Record<CaseTypeLabel, number> = {
  Functional: 1,
  Regression: 2,
  Smoke: 3,
  Security: 4,
  Performance: 5,
  Other: 6,
};

/** Human-readable labels for automation statuses. */
export type AutomationLabel = "Manual" | "In progress" | "Automated";

export const AUTO_STATUS_TO_LABEL: Record<AutomationStatus, AutomationLabel> = {
  NOT_AUTOMATED: "Manual",
  IN_PROGRESS: "In progress",
  AUTOMATED: "Automated",
};

export const AUTO_LABEL_TO_STATUS: Record<AutomationLabel, AutomationStatus> = {
  Manual: "NOT_AUTOMATED",
  "In progress": "IN_PROGRESS",
  Automated: "AUTOMATED",
};

/** Default select options for status dropdowns. */
export const STATUS_OPTIONS: readonly Status[] = [
  "DRAFT",
  "READY",
  "IN_PROGRESS",
  "BLOCKED",
  "DEPRECATED",
  "ARCHIVED",
] as const;

/** Default select options for severity dropdowns. */
export const SEVERITY_OPTIONS: readonly Severity[] = [
  "TRIVIAL",
  "MINOR",
  "NORMAL",
  "MAJOR",
  "CRITICAL",
] as const;
