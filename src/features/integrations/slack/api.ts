// src/features/slack/api.ts
import { http } from "@/lib/http";
import type {
  SlackConnectionDto,
  SlackConnectionRequest,
  SlackTestResponse,
} from "./types";

/**
 * Get saved Slack connection for a group.
 * If backend returns 404 — we return null.
 */
export async function getSlackConnection(
  groupId: number
): Promise<SlackConnectionDto | null> {
  try {
    const { data } = await http.get(
      `/api/integrations/slack/connection/${groupId}`
    );
    return data as SlackConnectionDto;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      return null;
    }
    throw e;
  }
}

/**
 * Create / update Slack connection.
 * `SlackConnectionRequest` can now include notifyRunStatusChange flag.
 */
export async function saveSlackConnection(
  groupId: number,
  req: SlackConnectionRequest
): Promise<SlackConnectionDto> {
  const { data } = await http.post(
    `/api/integrations/slack/connection/${groupId}`,
    req
  );
  return data as SlackConnectionDto;
}

/**
 * Remove Slack connection.
 */
export async function removeSlackConnection(groupId: number): Promise<void> {
  await http.delete(`/api/integrations/slack/connection/${groupId}`);
}

/**
 * Test Slack connection (send test message).
 */
export async function testSlackConnection(groupId: number): Promise<string> {
  const { data } = await http.post<SlackTestResponse>(
    `/api/integrations/slack/test/${groupId}`
  );
  return data.message;
}
