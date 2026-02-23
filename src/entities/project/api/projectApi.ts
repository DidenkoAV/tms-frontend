import { http } from "@/lib/http";

/* ========= types ========= */
export type Project = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  archived: boolean;
  groupId?: number;
  groupName?: string;
  groupPersonal?: boolean;
};

export type ProjectListItem = Required<Pick<Project, "id" | "name" | "code" | "archived">> & {
  description?: string | null;
  groupId: number;
  groupName: string;
  groupPersonal?: boolean;
};

export type ProjectCreateRequest = {
  name: string;
  code: string;
  description?: string;
};

export type ProjectUpdateRequest = {
  name?: string;
  description?: string | null;
};

/* ========= API ========= */

// All projects across all my groups
export async function listAllProjects(): Promise<ProjectListItem[]> {
  const { data } = await http.get<ProjectListItem[]>("/api/projects/all");
  return data;
}

// Projects within specific group
export async function listProjectsInGroup(groupId: number): Promise<ProjectListItem[]> {
  const { data } = await http.get<ProjectListItem[]>(`/api/groups/${groupId}/projects`);
  return data;
}

// Create project in group
export async function createProject(groupId: number, payload: ProjectCreateRequest): Promise<Project> {
  const { data } = await http.post<Project>(`/api/groups/${groupId}/projects`, payload);
  return data;
}

// Update project in group
export async function updateProject(groupId: number, id: number, payload: ProjectUpdateRequest): Promise<Project> {
  const { data } = await http.patch<Project>(`/api/groups/${groupId}/projects/${id}`, payload);
  return data;
}

// Archive (delete) in group
export async function deleteProject(groupId: number, id: number): Promise<void> {
  await http.delete(`/api/groups/${groupId}/projects/${id}`);
}

// Project details (if needed)
export async function getProject(groupId: number, id: number): Promise<Project> {
  const { data } = await http.get<Project>(`/api/groups/${groupId}/projects/${id}`);
  return data;
}

// Bulk archiving within one group
export async function bulkArchiveProjectsByGroup(
  groupId: number,
  ids: number[]
): Promise<{ archivedIds: number[]; alreadyArchivedIds: number[]; notFoundIds: number[] }> {
  const { data } = await http.post(`/api/groups/${groupId}/projects/bulk-archive`, { ids });
  return data;
}
