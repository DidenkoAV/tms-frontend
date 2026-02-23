// src/features/cases/api.ts
import { http } from "@/lib/http";
import type { TestCase, TestCaseUpdate, ImportTestCasesResponse } from "../model/types";

/**
 * Fetch all test cases for a given project.
 * Optionally filter by suiteId, search query, pagination, etc.
 */
export async function listCases(
  projectId: number,
  params?: { suiteId?: number; q?: string; page?: number; size?: number }
): Promise<TestCase[]> {
  const { data } = await http.get(`/api/projects/${projectId}/cases`, { params });
  return data;
}

/**
 * Fetch a single test case by its ID.
 */
export async function getCase(id: number): Promise<TestCase> {
  const { data } = await http.get(`/api/cases/${id}`);
  return data;
}

/**
 * Create a new test case under a specific project (and optionally suite).
 */
export async function createCase(
  projectId: number,
  payload: Omit<TestCaseUpdate, "suiteId"> & { suiteId?: number | null; title: string }
): Promise<TestCase> {
  const { data } = await http.post(`/api/projects/${projectId}/cases`, payload);
  return data;
}

/**
 * Update an existing test case (partial update via PATCH).
 */
export async function updateCase(id: number, payload: TestCaseUpdate): Promise<TestCase> {
  const { data } = await http.patch(`/api/cases/${id}`, payload);
  return data;
}

/**
 * Archive (soft-delete) a test case by ID.
 */
export async function deleteCase(id: number): Promise<void> {
  await http.delete(`/api/cases/${id}`);
}

/**
 * Fetch all suites belonging to a given project.
 */
export async function listSuites(projectId: number): Promise<
  { id: number; projectId: number; name: string; description?: string | null; archived: boolean }[]
> {
  const { data } = await http.get(`/api/projects/${projectId}/suites`);
  return data;
}


/**
 * Export all test cases from a project as JSON.
 * Returns a Blob object that can be used for file download.
 */
export async function exportCases(projectId: number): Promise<Blob> {
  const response = await http.get(`/api/projects/${projectId}/cases/export`, {
    responseType: "blob",
  });
  return response.data;
}

/**
 * Import test cases and suites into a project.
 * You can pass an optional `overwriteExisting` flag to update duplicates.
 */
export async function importCases(
  projectId: number,
  data: { cases: any[]; suites?: any[] },
  overwriteExisting = false
): Promise<{ imported: number; skipped: number; updated?: number }> {
  const params = { overwriteExisting };
  const { data: result } = await http.post(
    `/api/projects/${projectId}/cases/import`,
    data,
    { params }
  );
  return result;
}

