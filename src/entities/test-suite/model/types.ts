// Test Suite entity types

/** Main Suite model */
export type Suite = {
  id: number;
  projectId: number;
  parentId?: number | null;
  depth: number;
  name: string;
  description?: string | null;
  archived: boolean;
};

/** Create new suite */
export type SuiteCreateRequest = {
  name: string;
  description?: string | null;
  parentId?: number | null;
};

/** Update suite (PATCH) */
export type SuiteUpdateRequest = Partial<{
  name: string;
  description: string | null;
}>;
