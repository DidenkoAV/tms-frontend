// src/features/teams/types.ts

/**
 * DTO returned from backend describing saved Teams integration settings.
 */
export interface TeamsConnectionDto {
  id: number;
  groupId: number;
  webhookUrl: string | null;
  apiKey?: string | null;
  active: boolean;

  /** Notify when run is opened/closed */
  notifyRunStatusChange: boolean;

  /** Notify when Jenkins triggers a FULL run */
  notifyRunTriggerAll?: boolean;

  /** Notify when Jenkins triggers an AUTOMATED run */
  notifyRunTriggerAutomated?: boolean;

  /** Notify when Jenkins triggers a SELECTED tests run */
  notifyRunTriggerSelected?: boolean;
}

/**
 * Request body used to create/update Teams integration settings.
 */
export interface TeamsConnectionRequest {
  webhookUrl: string;
  apiKey?: string;

  /** Notify when run is opened/closed */
  notifyRunStatusChange?: boolean;

  /** Notify when Jenkins triggers a FULL run */
  notifyRunTriggerAll?: boolean;

  /** Notify when Jenkins triggers an AUTOMATED run */
  notifyRunTriggerAutomated?: boolean;

  /** Notify when Jenkins triggers a SELECTED tests run */
  notifyRunTriggerSelected?: boolean;
}

/**
 * Response from test Teams connection endpoint.
 */
export interface TeamsTestResponse {
  message: string;
}
