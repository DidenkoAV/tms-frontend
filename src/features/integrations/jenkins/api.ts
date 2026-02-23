// src/features/jenkins/api.ts

import { http } from "@/lib/http";

/* ---------- Types ---------- */

export interface JenkinsJobDto {
  key: string;
  name: string;
  jobPath: string;
  description?: string;
}

export interface JenkinsConnectionDto {
  baseUrl: string;
  username?: string | null;
  apiTokenMasked?: boolean;
  jobPath?: string | null;
  active?: boolean;
  jobs?: JenkinsJobDto[];
}

export interface JenkinsConnectionRequest {
  baseUrl: string;
  username?: string;
  apiToken?: string;
  jobPath?: string;
}

export interface JenkinsTestResponse {
  message: string;
}

/**
 * Trigger type that goes to backend and
 * maps to enum JenkinsTriggerType (ALL/AUTOMATED/SELECTED).
 */
export type JenkinsTriggerType = "all" | "automated" | "selected";

/* ---------- Get connection ---------- */

export async function getJenkinsConnection(
  groupId: number
): Promise<JenkinsConnectionDto | null> {
  try {
    const { data } = await http.get(
      `/api/integrations/jenkins/connection/${groupId}`
    );
    return data as JenkinsConnectionDto;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return null;
    }
    throw e;
  }
}

/* ---------- Save connection ---------- */

export async function saveJenkinsConnection(
  groupId: number,
  req: JenkinsConnectionRequest
): Promise<JenkinsConnectionDto> {
  const { data } = await http.post(
    `/api/integrations/jenkins/connection/${groupId}`,
    req
  );
  return data as JenkinsConnectionDto;
}

/* ---------- Delete connection ---------- */

export async function removeJenkinsConnection(
  groupId: number
): Promise<void> {
  await http.delete(`/api/integrations/jenkins/connection/${groupId}`);
}

/* ---------- Test connection ---------- */

export async function testJenkinsConnection(
  groupId: number
): Promise<string> {
  const { data } = await http.post<JenkinsTestResponse>(
    `/api/integrations/jenkins/test/${groupId}`
  );
  return data.message;
}

/* ---------- Trigger Jenkins job for run ---------- */

export async function triggerJenkinsRun(options: {
  groupId: number;
  runId: number;
  jobPath: string;           // User-selected job
  caseIds?: number[];        // Optional - subset of cases
  triggerType: JenkinsTriggerType; // all | automated | selected
}): Promise<void> {
  const { groupId, runId, jobPath, caseIds, triggerType } = options;

  await http.post(`/api/integrations/jenkins/run/${groupId}/${runId}`, {
    jobPath,
    caseIds,
    triggerType,
  });
}
