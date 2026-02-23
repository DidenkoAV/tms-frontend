// src/features/slack/types.ts

/** DTO returned by backend */
export interface SlackConnectionDto {
  id: number;
  workspaceUrl: string;
  botTokenMasked?: string | null;
  defaultChannel: string;
  active: boolean;

  /** Whether notifications about run status change are enabled */
  notifyRunStatusChange: boolean;

  /** future extension - all notification types here */
  notifications?: {
    runStatusChange?: boolean;
  };
}

/** Request to save Slack integration */
export interface SlackConnectionRequest {
  workspaceUrl: string;
  botToken?: string;
  defaultChannel: string;

  /** whether to enable run status change notifications */
  notifyRunStatusChange?: boolean;

  /** future extension */
  notifications?: {
    runStatusChange?: boolean;
  };
}

export interface SlackTestResponse {
  message: string;
}
