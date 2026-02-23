// src/features/milestones/api.ts
import { http } from "@/lib/http";
import type {
  Milestone,
  MilestoneCreate,
  MilestoneUpdate,
  RunSummary,
  MilestoneAddRunsPayload,
} from "../model/types";


function toInstantISO(value?: string | null): string | null | undefined {
  if (value == null) return value;           // null/undefined
  const v = String(value).trim();
  if (!v) return null;                       // Empty strings -> null
  // If already has zone (Z or ±HH:MM) - keep as is
  if (/[zZ]$/.test(v) || /[+\-]\d{2}:\d{2}$/.test(v)) return v;
  // Otherwise treat as local and convert to UTC ISO
  const d = new Date(v);                     // "2025-09-20T01:02" -> local time
  if (Number.isNaN(d.getTime())) return v;   // Just in case - don't break
  return d.toISOString();                    // -> "2025-09-20T05:02:00.000Z" (example)
}

/** GET /api/projects/{projectId}/milestones */
export async function listMilestones(projectId: number): Promise<Milestone[]> {
  const { data } = await http.get(`/api/projects/${projectId}/milestones`);
  return data;
}

/** GET /api/milestones/{id} */
export async function getMilestone(id: number): Promise<Milestone> {
  const { data } = await http.get(`/api/milestones/${id}`);
  return data;
}

/** POST /api/projects/{projectId}/milestones */
export async function createMilestone(
  projectId: number,
  payload: MilestoneCreate
): Promise<Milestone> {
  const body = {
    ...payload,
    startDate: toInstantISO((payload as any).startDate),
    dueDate: toInstantISO((payload as any).dueDate),
  };
  const { data } = await http.post(`/api/projects/${projectId}/milestones`, body);
  return data;
}

/** PATCH /api/milestones/{id} */
export async function updateMilestone(
  id: number,
  payload: MilestoneUpdate
): Promise<Milestone> {
  const body = {
    ...payload,
    startDate: toInstantISO((payload as any).startDate),
    dueDate: toInstantISO((payload as any).dueDate),
  };
  const { data } = await http.patch(`/api/milestones/${id}`, body);
  return data;
}

/** DELETE /api/milestones/{id}  (archive) */
export async function archiveMilestone(id: number): Promise<void> {
  await http.delete(`/api/milestones/${id}`);
}

/** GET /api/milestones/{milestoneId}/runs */
export async function listMilestoneRuns(milestoneId: number): Promise<RunSummary[]> {
  const { data } = await http.get(`/api/milestones/${milestoneId}/runs`);
  return data;
}

/** POST /api/milestones/{milestoneId}/runs  (bulk add runIds) */
export async function addRunsToMilestone(
  milestoneId: number,
  runIds: number[]
): Promise<RunSummary[]> {
  const payload: MilestoneAddRunsPayload = { runIds };
  const { data } = await http.post(`/api/milestones/${milestoneId}/runs`, payload);
  return data;
}

/** DELETE /api/milestones/{milestoneId}/runs/{runId} */
export async function removeRunFromMilestone(
  milestoneId: number,
  runId: number
): Promise<void> {
  await http.delete(`/api/milestones/${milestoneId}/runs/${runId}`);
}
