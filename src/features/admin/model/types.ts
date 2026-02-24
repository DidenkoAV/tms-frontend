/**
 * User list item returned from GET /api/admin/users
 */
export type UserListItem = {
  id: number;
  email: string;
  fullName: string;
  enabled: boolean;
  roles: string[];
  groupCount: number;
  createdAt: string;
};

/**
 * Request body for POST /api/admin/users/{id}/roles
 */
export type UpdateUserRolesRequest = {
  roles: string[];
};

