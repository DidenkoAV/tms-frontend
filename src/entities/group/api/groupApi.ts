import { http } from "@/lib/http";
import type {
  TokenItem,
  GroupDetails,
  GroupRole,
  JiraConnectionDto,
} from "../model/types";

/* ---------- Password ---------- */
export async function changePassword(currentPassword: string, newPassword: string) {
  return http.post("/api/auth/password/change", { currentPassword, newPassword });
}

/* ---------- Tokens ---------- */
export async function listTokens(): Promise<TokenItem[]> {
  const { data } = await http.get("/api/auth/tokens");
  return data;
}

export async function createToken(name: string, scopes?: string): Promise<TokenItem> {
  const { data } = await http.post("/api/auth/tokens", { name, scopes });
  return data; 
}

export async function revokeToken(id: string): Promise<void> {
  await http.delete(`/api/auth/tokens/${id}`);
}

/* ---------- Groups ---------- */
export async function listMyGroups(): Promise<GroupDetails[]> {
  const { data } = await http.get("/api/groups/my");
  return data;
}

export async function getGroup(groupId: number): Promise<GroupDetails> {
  const { data } = await http.get(`/api/groups/${groupId}`);
  return data;
}

export async function createGroup(name: string): Promise<GroupDetails> {
  const { data } = await http.post("/api/groups", { name });
  return data;
}

export async function renameGroup(groupId: number, name: string): Promise<GroupDetails> {
  const { data } = await http.patch(`/api/groups/${groupId}`, { name });
  return data;
}

export async function deleteGroup(groupId: number): Promise<void> {
  await http.delete(`/api/groups/${groupId}`);
}

export async function addMember(groupId: number, email: string): Promise<void> {
  await http.post(`/api/groups/${groupId}/members`, { email });
}

export async function changeMemberRole(
  groupId: number,
  membershipId: number,
  role: GroupRole
): Promise<void> {
  await http.patch(`/api/groups/${groupId}/members/${membershipId}`, { role });
}

export async function removeMember(groupId: number, membershipId: number): Promise<void> {
  await http.delete(`/api/groups/${groupId}/members/${membershipId}`);
}

export async function acceptGroupInvite(token: string) {
  const { data } = await http.post("/api/groups/invite/accept", { token });
  return data; 
}

export async function leaveGroup(groupId: number): Promise<void> {
  await http.post(`/api/groups/${groupId}/leave`);
}
