// src/features/cases/api.ts
import { http } from "@/lib/http";
import type { TestCase, TestCaseUpdate, ImportTestCasesResponse, TestCasePageResponse } from "../model/types";

const CASES_TTL_MS = 30_000;

let suitesCache = new Map<number, {
  data: { id: number; projectId: number; name: string; description?: string | null; archived: boolean }[];
  ts: number;
}>();
let suitesPromise = new Map<number, Promise<{ id: number; projectId: number; name: string; description?: string | null; archived: boolean }[]>>();

let caseCache = new Map<number, { data: TestCase; ts: number }>();
let casePromise = new Map<number, Promise<TestCase>>();

function isFresh(ts: number) {
  return Date.now() - ts < CASES_TTL_MS;
}

export function invalidateCaseCaches(projectId?: number, caseId?: number) {
  if (typeof projectId === "number") {
    suitesCache.delete(projectId);
    suitesPromise.delete(projectId);
  } else {
    suitesCache.clear();
    suitesPromise.clear();
  }

  if (typeof caseId === "number") {
    caseCache.delete(caseId);
    casePromise.delete(caseId);
  } else if (projectId === undefined) {
    caseCache.clear();
    casePromise.clear();
  }
}

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
 * Fetch paginated test cases for a project with optional server-side title filter.
 */
export async function listCasesPage(
  projectId: number,
  params?: { suiteId?: number; q?: string; page?: number; size?: number }
): Promise<TestCasePageResponse> {
  const { data } = await http.get<TestCasePageResponse>(`/api/projects/${projectId}/cases/page`, { params });
  return data;
}

/**
 * Fetch specific test cases by IDs inside a project.
 */
export async function listCasesByIds(
  projectId: number,
  caseIds: number[]
): Promise<TestCase[]> {
  if (!caseIds.length) return [];

  const uniqueIds = Array.from(new Set(caseIds));
  const freshMap = new Map<number, TestCase>();
  const missingIds: number[] = [];

  for (const id of uniqueIds) {
    const cached = caseCache.get(id);
    if (cached && isFresh(cached.ts)) {
      freshMap.set(id, cached.data);
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length > 0) {
    const { data } = await http.post(`/api/projects/${projectId}/cases/by-ids`, {
      caseIds: missingIds,
    });
    for (const item of data as TestCase[]) {
      caseCache.set(item.id, { data: item, ts: Date.now() });
      freshMap.set(item.id, item);
    }
  }

  // Keep response order aligned with incoming caseIds
  return caseIds
    .map((id) => freshMap.get(id))
    .filter((item): item is TestCase => Boolean(item));
}

/**
 * Fetch a single test case by its ID.
 */
export async function getCase(id: number): Promise<TestCase> {
  const cached = caseCache.get(id);
  if (cached && isFresh(cached.ts)) {
    return cached.data;
  }
  if (casePromise.has(id)) {
    return casePromise.get(id)!;
  }

  const p = http.get(`/api/cases/${id}`)
    .then(({ data }) => {
      caseCache.set(id, { data, ts: Date.now() });
      return data as TestCase;
    })
    .finally(() => {
      casePromise.delete(id);
    });

  casePromise.set(id, p);
  return p;
}

/**
 * Create a new test case under a specific project (and optionally suite).
 */
export async function createCase(
  projectId: number,
  payload: Omit<TestCaseUpdate, "suiteId"> & { suiteId?: number | null; title: string }
): Promise<TestCase> {
  const { data } = await http.post(`/api/projects/${projectId}/cases`, payload);
  invalidateCaseCaches(projectId);
  return data;
}

/**
 * Update an existing test case (partial update via PATCH).
 */
export async function updateCase(id: number, payload: TestCaseUpdate): Promise<TestCase> {
  const { data } = await http.patch(`/api/cases/${id}`, payload);
  caseCache.set(id, { data, ts: Date.now() });
  return data;
}

/**
 * Archive (soft-delete) a test case by ID.
 */
export async function deleteCase(id: number): Promise<void> {
  await http.delete(`/api/cases/${id}`);
  invalidateCaseCaches(undefined, id);
}

/**
 * Archive (soft-delete) multiple test cases in a single request.
 */
export async function bulkArchiveCases(
  projectId: number,
  caseIds: number[]
): Promise<{ deletedCount: number }> {
  const uniqueIds = Array.from(new Set(caseIds.filter((id) => Number.isFinite(id))));
  if (!uniqueIds.length) {
    return { deletedCount: 0 };
  }
  const { data } = await http.post(`/api/projects/${projectId}/cases/bulk-archive`, {
    caseIds: uniqueIds,
  });
  invalidateCaseCaches(projectId);
  uniqueIds.forEach((id) => invalidateCaseCaches(undefined, id));
  return data;
}

/**
 * Fetch all suites belonging to a given project.
 */
export async function listSuites(projectId: number): Promise<
  { id: number; projectId: number; name: string; description?: string | null; archived: boolean }[]
> {
  const cached = suitesCache.get(projectId);
  if (cached && isFresh(cached.ts)) {
    return cached.data;
  }
  if (suitesPromise.has(projectId)) {
    return suitesPromise.get(projectId)!;
  }

  const p = http.get(`/api/projects/${projectId}/suites`)
    .then(({ data }) => {
      const normalized = data as { id: number; projectId: number; name: string; description?: string | null; archived: boolean }[];
      suitesCache.set(projectId, { data: normalized, ts: Date.now() });
      return normalized;
    })
    .finally(() => {
      suitesPromise.delete(projectId);
    });

  suitesPromise.set(projectId, p);
  return p;
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
