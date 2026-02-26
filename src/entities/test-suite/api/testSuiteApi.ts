import { http } from "@/lib/http";
import type { Suite, SuiteCreateRequest, SuiteUpdateRequest } from "../model/types";

/** GET /api/projects/{projectId}/suites */
export async function listSuites(projectId: number): Promise<Suite[]> {
  const { data } = await http.get<Suite[]>(`/api/projects/${projectId}/suites`);
  return data;
}

/** POST /api/projects/{projectId}/suites + projectId in body */
export async function createSuite(
  projectId: number,
  payload: Omit<SuiteCreateRequest, "projectId">
): Promise<Suite> {
  const body = { ...payload, projectId };   // <-- IMPORTANT!
  const { data } = await http.post<Suite>(`/api/projects/${projectId}/suites`, body);
  return data;
}

/** PATCH /api/suites/{id} */
export async function updateSuite(id: number, payload: SuiteUpdateRequest): Promise<Suite> {
  const { data } = await http.patch<Suite>(`/api/suites/${id}`, payload);
  return data;
}

/** DELETE /api/suites/{id} (soft-archive) */
export async function archiveSuite(id: number): Promise<void> {
  await http.delete(`/api/suites/${id}`);
}

/** POST /api/suites/batch-delete - Delete multiple suites (with cascading) */
export async function batchDeleteSuites(suiteIds: number[]): Promise<{ deletedCount: number }> {
  const { data } = await http.post<{ deletedCount: number }>(`/api/suites/batch-delete`, {
    suiteIds,
  });
  return data;
}
