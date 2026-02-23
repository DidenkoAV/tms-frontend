export type JiraConnectionDto = {
  baseUrl: string;
  email: string;
  defaultProject?: string;
  defaultIssueType?: string;
  hasToken: boolean;
};

export type Attachment = {
  name: string;
  contentBase64: string;
};

export type AttachmentInfo = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
};

export type JiraIssue = {
  id: number;
  issueKey: string;
  issueUrl: string;
  summary?: string;
  description?: string;
  status?: string;
  author?: string;
  priority?: string;
  attachments?: AttachmentInfo[];
};

export interface JiraIssuesBlockProps {
  groupId: number;
  runId: number | null;
  testCaseId: number;
  notify?: (
    kind: "info" | "error" | "success" | "warning",
    msg: string
  ) => void;
}

export type BugStatPart = {
  label: string;   // Dynamic status
  color: string;   // Assign ourselves
  value: number;
};