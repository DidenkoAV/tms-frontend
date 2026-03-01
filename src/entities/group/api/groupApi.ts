import { http } from "@/lib/http";
import type {
  TokenItem,
  GroupDetails,
  GroupRole,
  JiraConnectionDto,
  GroupMemberSimple,
} from "../model/types";

const TOKENS_TTL_MS = 30_000;
const GROUPS_TTL_MS = 30_000;

let tokensCache: { data: TokenItem[]; ts: number } | null = null;
let tokensPromise: Promise<TokenItem[]> | null = null;

let groupsCache: { data: GroupDetails[]; ts: number } | null = null;
let groupsPromise: Promise<GroupDetails[]> | null = null;

const groupDetailsCache = new Map<number, { data: GroupDetails; ts: number }>();
const groupDetailsPromise = new Map<number, Promise<GroupDetails>>();

function isFresh(ts: number, ttlMs: number) {
  return Date.now() - ts < ttlMs;
}

export function invalidateTokensCache() {
  tokensCache = null;
}

export function invalidateGroupsCache(groupId?: number) {
  groupsCache = null;
  groupsPromise = null;
  if (typeof groupId === "number") {
    groupDetailsCache.delete(groupId);
    groupDetailsPromise.delete(groupId);
    return;
  }
  groupDetailsCache.clear();
  groupDetailsPromise.clear();
}

/* ---------- Password ---------- */
export async function changePassword(currentPassword: string, newPassword: string) {
  return http.post("/api/auth/password/change", { currentPassword, newPassword });
}

/* ---------- Tokens ---------- */
export async function listTokens(force = false): Promise<TokenItem[]> {
  if (!force && tokensCache && isFresh(tokensCache.ts, TOKENS_TTL_MS)) {
    return tokensCache.data;
  }
  if (!force && tokensPromise) {
    return tokensPromise;
  }

  tokensPromise = http.get("/api/auth/tokens")
    .then(({ data }) => {
      const normalized = (data || []) as TokenItem[];
      tokensCache = { data: normalized, ts: Date.now() };
      return normalized;
    })
    .finally(() => {
      tokensPromise = null;
    });

  return tokensPromise;
}

export async function createToken(name: string, scopes?: string): Promise<TokenItem> {
  const { data } = await http.post("/api/auth/tokens", { name, scopes });
  tokensCache = null;
  return data;
}

export async function revokeToken(id: string): Promise<void> {
  await http.delete(`/api/auth/tokens/${id}`);
  tokensCache = null;
}

/* ---------- Groups ---------- */
export async function listMyGroups(force = false): Promise<GroupDetails[]> {
  if (!force && groupsCache && isFresh(groupsCache.ts, GROUPS_TTL_MS)) {
    return groupsCache.data;
  }
  if (!force && groupsPromise) {
    return groupsPromise;
  }

  groupsPromise = http.get("/api/groups/my")
    .then(({ data }) => {
      const normalized = (data || []) as GroupDetails[];
      groupsCache = { data: normalized, ts: Date.now() };
      return normalized;
    })
    .finally(() => {
      groupsPromise = null;
    });

  return groupsPromise;
}

export async function getGroup(groupId: number, force = false): Promise<GroupDetails> {
  const cached = groupDetailsCache.get(groupId);
  if (!force && cached && isFresh(cached.ts, GROUPS_TTL_MS)) {
    return cached.data;
  }

  if (!force && groupDetailsPromise.has(groupId)) {
    return groupDetailsPromise.get(groupId)!;
  }

  const p = http.get(`/api/groups/${groupId}`)
    .then(({ data }) => {
      const normalized = data as GroupDetails;
      groupDetailsCache.set(groupId, { data: normalized, ts: Date.now() });
      return normalized;
    })
    .finally(() => {
      groupDetailsPromise.delete(groupId);
    });

  groupDetailsPromise.set(groupId, p);
  return p;
}

export async function getGroupMembers(groupId: number): Promise<GroupMemberSimple[]> {
  const { data } = await http.get(`/api/groups/${groupId}/members`);
  return data;
}

export async function createGroup(name: string): Promise<GroupDetails> {
  const { data } = await http.post("/api/groups", { name });
  invalidateGroupsCache();
  return data;
}

export async function renameGroup(groupId: number, name: string): Promise<GroupDetails> {
  const { data } = await http.patch(`/api/groups/${groupId}`, { name });
  invalidateGroupsCache(groupId);
  return data;
}

export async function deleteGroup(groupId: number): Promise<void> {
  await http.delete(`/api/groups/${groupId}`);
  invalidateGroupsCache(groupId);
}

export async function inviteMember(groupId: number, email: string): Promise<void> {
  await http.post(`/api/groups/${groupId}/invites`, { email });
  invalidateGroupsCache(groupId);
}

export async function getPendingInvites(groupId: number): Promise<GroupMemberSimple[]> {
  const { data } = await http.get(`/api/groups/${groupId}/invites/pending`);
  return data;
}

export async function cancelInvite(groupId: number, membershipId: number): Promise<void> {
  await http.delete(`/api/groups/${groupId}/invites/${membershipId}`);
  invalidateGroupsCache(groupId);
}

export async function changeMemberRole(
  groupId: number,
  membershipId: number,
  role: GroupRole
): Promise<void> {
  await http.patch(`/api/groups/${groupId}/members/${membershipId}/role`, { role });
  invalidateGroupsCache(groupId);
}

export async function removeMember(groupId: number, membershipId: number): Promise<void> {
  await http.delete(`/api/groups/${groupId}/members/${membershipId}`);
  invalidateGroupsCache(groupId);
}

export async function acceptGroupInvite(token: string) {
  const { data } = await http.post("/api/groups/invite/accept", { token });
  return data; 
}

export async function leaveGroup(groupId: number): Promise<void> {
  await http.post(`/api/groups/${groupId}/leave`);
  invalidateGroupsCache(groupId);
}
