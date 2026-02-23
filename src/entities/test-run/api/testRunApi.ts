import { http } from "@/lib/http";
import type { Run, RunCreate, RunUpdate, RunCase, BulkResultResponse } from "../model/types";

/** List of project runs */
export async function listRuns(projectId: number): Promise<Run[]> {
  const { data } = await http.get(`/api/projects/${projectId}/runs`);
  return data;
}

/** Get run */
export async function getRun(id: number): Promise<Run> {
  const { data } = await http.get(`/api/runs/${id}`);
  return data;
}

/** Create run */
export async function createRun(projectId: number, payload: RunCreate): Promise<Run> {
  // Some backends require projectId in body, even if it's in path
  const body = { projectId, ...payload };
  const { data } = await http.post(`/api/projects/${projectId}/runs`, body);
  return data;
}

/** Update run (partially) */
export async function updateRun(id: number, payload: RunUpdate): Promise<Run> {
  const { data } = await http.patch(`/api/runs/${id}`, payload);
  return data;
}

/** Archive (delete) one run */
export async function deleteRun(id: number): Promise<void> {
  await http.delete(`/api/runs/${id}`);
}

/** Bulk archiving of runs by id */
export async function archiveRunsBulk(ids: number[]): Promise<BulkResultResponse> {
  if (!ids?.length) return { affected: 0 };
  const { data } = await http.delete(`/api/runs`, { params: { ids: ids.join(",") } });
  return data;
  // Alternative (ids=1&ids=2&...):
  // const { data } = await http.delete(`/api/runs`, {
  //   params: { ids },
  //   paramsSerializer: { indexes: false },
  // });
  // return data;
}

/** Cases of a run */
export async function listRunCases(runId: number): Promise<RunCase[]> {
  const { data } = await http.get(`/api/runs/${runId}/cases`);
  return data;
}

/** Add cases to a run (backend expects { caseIds: number[] }) */
export async function addCasesToRun(runId: number, caseIds: number[]) {
  const { data } = await http.post(`/api/runs/${runId}/cases`, { caseIds });
  return data as RunCase[]; // server usually returns RunCase[]
}

/** Remove a single case from a run */
export async function removeCaseFromRun(runId: number, caseId: number): Promise<void> {
  await http.delete(`/api/runs/${runId}/cases/${caseId}`);
}

/** Remove multiple cases from a run */
export async function removeCasesFromRun(runId: number, caseIds: number[]): Promise<BulkResultResponse> {
  if (!caseIds?.length) return { affected: 0 };
  const { data } = await http.delete(`/api/runs/${runId}/cases`, {
    params: { caseIds: caseIds.join(",") },
  });
  return data as BulkResultResponse;
}
