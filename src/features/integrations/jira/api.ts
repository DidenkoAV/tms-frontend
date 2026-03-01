import { http } from "@/lib/http";
import type { JiraConnectionDto, Attachment, JiraIssue } from "./types";

const JIRA_CONN_TTL_MS = 30_000;
const jiraConnectionCache = new Map<number, { data: JiraConnectionDto | null; ts: number }>();
const jiraConnectionPromise = new Map<number, Promise<JiraConnectionDto | null>>();

function isFresh(ts: number, ttlMs: number) {
  return Date.now() - ts < ttlMs;
}

export function invalidateJiraConnectionCache(groupId?: number) {
  if (typeof groupId === "number") {
    jiraConnectionCache.delete(groupId);
    jiraConnectionPromise.delete(groupId);
    return;
  }
  jiraConnectionCache.clear();
  jiraConnectionPromise.clear();
}

/* ---------- Jira Connection ---------- */
export async function getJiraConnection(groupId: number, force = false): Promise<JiraConnectionDto | null> {
  const cached = jiraConnectionCache.get(groupId);
  if (!force && cached && isFresh(cached.ts, JIRA_CONN_TTL_MS)) {
    return cached.data;
  }
  if (!force && jiraConnectionPromise.has(groupId)) {
    return jiraConnectionPromise.get(groupId)!;
  }

  const p = (async () => {
  try {
    const { data } = await http.get(`/api/integrations/jira/connection/${groupId}`);

    // If backend returned null (no connection) - return null
    if (!data) {
      jiraConnectionCache.set(groupId, { data: null, ts: Date.now() });
      return null;
    }

    const normalized = {
      baseUrl: data.baseUrl,
      email: data.email,
      defaultProject: data.defaultProject,
      defaultIssueType: data.defaultIssueType,
      hasToken: !!data.hasToken,
    };
    jiraConnectionCache.set(groupId, { data: normalized, ts: Date.now() });
    return normalized;
  } catch {
    // Any error - assume no integration
    jiraConnectionCache.set(groupId, { data: null, ts: Date.now() });
    return null;
  }
  })().finally(() => {
    jiraConnectionPromise.delete(groupId);
  });

  jiraConnectionPromise.set(groupId, p);
  return p;
}

export async function saveJiraConnection(
  groupId: number,
  req: {
    baseUrl: string;
    email: string;
    apiToken?: string;
    defaultProject?: string;
    defaultIssueType?: string;
  }
): Promise<JiraConnectionDto> {
  const { data } = await http.post(`/api/integrations/jira/connection/${groupId}`, req);
  const normalized = {
    baseUrl: data.baseUrl,
    email: data.email,
    defaultProject: data.defaultProject,
    defaultIssueType: data.defaultIssueType,
    hasToken: true,
  };
  jiraConnectionCache.set(groupId, { data: normalized, ts: Date.now() });
  return normalized;
}

export async function removeJiraConnection(groupId: number): Promise<void> {
  await http.delete(`/api/integrations/jira/connection/${groupId}`);
  jiraConnectionCache.set(groupId, { data: null, ts: Date.now() });
}

export async function testJiraConnection(groupId: number): Promise<string> {
  const { data } = await http.post(`/api/integrations/jira/test/${groupId}`);
  return data.message;
}

/* ---------- Jira Issues ---------- */
export async function createJiraIssue(
  groupId: number,
  testCaseId: number,
  req: {
    summary: string;
    description: string;
    issueType?: string;
    priority?: string;
    author?: string;
    attachments?: Attachment[];
  }
): Promise<JiraIssue> {
  const { data } = await http.post(
    `/api/integrations/jira/issue/${groupId}/${testCaseId}`,
    req
  );
  return data;
}

export async function listJiraIssues(
  groupId: number,
  testCaseId: number
): Promise<JiraIssue[]> {
  const { data } = await http.get(`/api/integrations/jira/issues/${groupId}/${testCaseId}`);
  return data;
}

export async function batchListJiraIssues(
  groupId: number,
  testCaseIds: number[]
): Promise<Record<number, JiraIssue[]>> {
  const { data } = await http.post(`/api/integrations/jira/issues/batch/${groupId}`, testCaseIds);
  return data;
}

export async function listJiraIssueTypes(groupId: number): Promise<string[]> {
  const { data } = await http.get(`/api/integrations/jira/issue-types/${groupId}`);
  return data;
}

export async function attachJiraIssue(
  groupId: number,
  testCaseId: number,
  issueKey: string
) {
  const { data } = await http.post(
    `/api/integrations/jira/issue/attach/${groupId}/${testCaseId}`,
    { issueKey }
  );
  return data;
}

export async function detachJiraIssue(id: number): Promise<void> {
  await http.delete(`/api/integrations/jira/issues/unlink/${id}`);
}

export interface ProjectIssueStats {
  total: number;
  statuses: Record<string, number>;
}

export async function getProjectIssueStats(
  groupId: number,
  projectIds?: number[]
): Promise<ProjectIssueStats> {
  let query = "";

  if (projectIds && projectIds.length > 0) {
    query = "?" + projectIds.map(id => `projectIds=${id}`).join("&");
  }

  const { data } = await http.get(
    `/api/integrations/jira/projects-stats/${groupId}${query}`
  );
  console.log(data);
  return data;
}
