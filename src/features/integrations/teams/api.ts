// src/features/teams/api.ts

import { http } from "@/lib/http";
import type {
  TeamsConnectionDto,
  TeamsConnectionRequest,
  TeamsTestResponse,
} from "./types";

/**
 * Get saved Teams connection for a group.
 * If backend returns 404 — we return null.
 */
export async function getTeamsConnection(
  groupId: number
): Promise<TeamsConnectionDto | null> {
  try {
    const { data } = await http.get(
      `/api/integrations/teams/connection/${groupId}`
    );
    return data as TeamsConnectionDto;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return null;
    }
    throw e;
  }
}

/**
 * Create/update Teams connection.
 */
export async function saveTeamsConnection(
  groupId: number,
  req: TeamsConnectionRequest
): Promise<TeamsConnectionDto> {
  const { data } = await http.post(
    `/api/integrations/teams/connection/${groupId}`,
    req
  );
  return data as TeamsConnectionDto;
}

/**
 * Remove Teams connection.
 */
export async function removeTeamsConnection(groupId: number): Promise<void> {
  await http.delete(`/api/integrations/teams/connection/${groupId}`);
}

/**
 * Test Teams connection (send test message).
 */
export async function testTeamsConnection(groupId: number): Promise<string> {
  const { data } = await http.post<TeamsTestResponse>(
    `/api/integrations/teams/test/${groupId}`
  );
  return data.message;
}
