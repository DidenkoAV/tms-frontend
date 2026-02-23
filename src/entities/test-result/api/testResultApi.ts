// src/features/results/api.ts
import { http } from "@/lib/http";
import type { RunCaseResult, RunCaseResultCreate } from "../model/types";

/**
 * Get list of results for specific case within run.
 * GET /api/runs/{runId}/cases/{caseId}/results
 */
export async function listResults(
  runId: number,
  caseId: number
): Promise<RunCaseResult[]> {
  const { data } = await http.get(
    `/api/runs/${runId}/cases/${caseId}/results`
  );
  return data;
}

/**
 * Add new result for case in run.
 * POST /api/runs/{runId}/cases/{caseId}/results
 */
export async function addResult(
  runId: number,
  caseId: number,
  payload: RunCaseResultCreate
): Promise<RunCaseResult> {
  console.log("=== Sending result payload ===");
  console.log("URL:", `/api/runs/${runId}/cases/${caseId}/results`);
  console.log("Body:", JSON.stringify(payload, null, 2));

  const { data } = await http.post(
    `/api/runs/${runId}/cases/${caseId}/results`,
    payload
  );
  return data;
}


/**
 * Delete one result by ID.
 * DELETE /api/runs/{runId}/results/{resultId}
 */
export async function deleteResult(
  runId: number,
  resultId: number
): Promise<void> {
  await http.delete(`/api/runs/${runId}/results/${resultId}`);
}

/**
 * Delete multiple results (or one) by list of IDs.
 * DELETE /api/runs/{runId}/results/bulk
 * @param resultIds — array of result IDs to delete
 * @returns number of deleted records
 */
export async function deleteResultsBulk(
  runId: number,
  resultIds: number[]
): Promise<number> {
  const { data } = await http.delete(`/api/runs/${runId}/results/bulk`, {
    data: resultIds,
  });
  return data;
}
