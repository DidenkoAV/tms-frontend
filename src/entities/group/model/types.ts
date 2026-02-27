/***** Me *****/
export type Me = {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  enabled?: boolean;
  createdAt?: string;

  currentGroupId?: number | null;
  groups?: GroupSummary[];
};

/***** Tokens *****/
export type TokenItem = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string | null;
  revoked?: boolean | null;
  tokenOnce?: string | null;
};

/***** Tabs *****/
export type TabKey = "profile" | "password" | "tokens" | "integrations" | "groups";

/***** Groups *****/
export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";
export type MembershipStatus = "ACTIVE" | "PENDING" | "REMOVED";
export type GroupType = "PERSONAL" | "SHARED";

export interface GroupSummary {
  id: number;
  name: string;
  groupType: GroupType;
  ownerId: number;
  ownerEmail: string;
  membersCount?: number;
}

export interface GroupMember {
  id: number; // membership id
  userId: number;
  email: string;
  fullName: string;
  role: GroupRole;
  status: MembershipStatus;
  invitedByEmail?: string | null;
  createdAt: string; // ISO
}

export interface GroupMemberSimple {
  id: number; // membership id
  userId: number;
  userName: string;
  userEmail: string;
  role: GroupRole;
  status: MembershipStatus;
  joinedAt: string | null;
  invitedBy: string | null;
}

export interface GroupDetails extends GroupSummary {
  members: GroupMember[]; // Always normalized to [] in component
}

/***** Jira *****/
export type JiraConnectionDto = {
  baseUrl: string;
  email: string;
  defaultProject?: string;
  defaultIssueType?: string;
  hasToken: boolean;
};
