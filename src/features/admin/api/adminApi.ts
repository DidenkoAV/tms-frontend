import { http } from "@/lib/http";
import type { UserListItem, UpdateUserRolesRequest } from "../model/types";

/**
 * List all users (ROLE_ADMIN required)
 */
export async function listAllUsers(): Promise<UserListItem[]> {
  const { data } = await http.get("/api/admin/users");
  return data;
}

/**
 * Enable user account (ROLE_ADMIN required)
 */
export async function enableUser(userId: number): Promise<void> {
  await http.post(`/api/admin/users/${userId}/enable`);
}

/**
 * Disable user account (ROLE_ADMIN required)
 */
export async function disableUser(userId: number): Promise<void> {
  await http.post(`/api/admin/users/${userId}/disable`);
}

/**
 * Delete user permanently (ROLE_ADMIN required)
 */
export async function deleteUser(userId: number): Promise<void> {
  await http.delete(`/api/admin/users/${userId}`);
}

/**
 * Update user roles (ROLE_ADMIN required)
 */
export async function updateUserRoles(userId: number, roles: string[]): Promise<void> {
  await http.post(`/api/admin/users/${userId}/roles`, { roles } as UpdateUserRolesRequest);
}

