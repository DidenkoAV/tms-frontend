// src/features/jenkins/types.ts

export interface JenkinsConnectionDto {
  id: number;
  baseUrl: string;
  jobPath: string;
  username?: string | null;
  apiTokenMasked?: string | null;
  active: boolean;
}

export interface JenkinsConnectionRequest {
  baseUrl: string;
  jobPath: string;
  username?: string;
  apiToken?: string;
}

export interface JenkinsTestResponse {
  message: string;
}
