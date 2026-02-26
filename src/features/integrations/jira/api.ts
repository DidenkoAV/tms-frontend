import { http } from "@/lib/http";
import type { JiraConnectionDto, Attachment, JiraIssue } from "./types";

/* ---------- Jira Connection ---------- */
export async function getJiraConnection(groupId: number): Promise<JiraConnectionDto | null> {
  try {
    const { data } = await http.get(`/api/integrations/jira/connection/${groupId}`);

    // If backend returned null (no connection) - return null
    if (!data) {
      return null;
    }

    return {
      baseUrl: data.baseUrl,
      email: data.email,
      defaultProject: data.defaultProject,
      defaultIssueType: data.defaultIssueType,
      hasToken: !!data.hasToken,
    };
  } catch {
    // Any error - assume no integration
    return null;
  }
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
  return {
    baseUrl: data.baseUrl,
    email: data.email,
    defaultProject: data.defaultProject,
    defaultIssueType: data.defaultIssueType,
    hasToken: true,
  };
}

export async function removeJiraConnection(groupId: number): Promise<void> {
  await http.delete(`/api/integrations/jira/connection/${groupId}`);
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
