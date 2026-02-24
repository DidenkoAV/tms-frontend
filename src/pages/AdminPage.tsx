import { useState, useEffect } from "react";
import { listAllUsers, enableUser, disableUser, deleteUser, updateUserRoles } from "@/features/admin/api/adminApi";
import type { UserListItem } from "@/features/admin/model/types";
import { RefreshCw, UserCheck, UserX, Trash2, Shield } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoles, setEditingRoles] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEnableUser = async (userId: number) => {
    try {
      await enableUser(userId);
      await loadUsers();
    } catch (err) {
      console.error("Failed to enable user:", err);
    }
  };

  const handleDisableUser = async (userId: number) => {
    try {
      await disableUser(userId);
      await loadUsers();
    } catch (err) {
      console.error("Failed to disable user:", err);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const startEditingRoles = (userId: number, currentRoles: string[]) => {
    setEditingRoles(userId);
    setSelectedRoles(currentRoles);
  };

  const cancelEditingRoles = () => {
    setEditingRoles(null);
    setSelectedRoles([]);
  };

  const saveRoles = async (userId: number) => {
    try {
      await updateUserRoles(userId, selectedRoles);
      setEditingRoles(null);
      setSelectedRoles([]);
      await loadUsers();
    } catch (err) {
      console.error("Failed to update roles:", err);
    }
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/50">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Groups</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-xs text-slate-900 dark:text-slate-100">{user.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-900 dark:text-slate-100">{user.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-900 dark:text-slate-100">{user.fullName || "—"}</td>
                  <td className="px-4 py-3">
                    {user.enabled ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-600/30 dark:text-slate-200">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingRoles === user.id ? (
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes("ROLE_USER")}
                            onChange={() => toggleRole("ROLE_USER")}
                            className="h-3 w-3 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-400/30"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300">ROLE_USER</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes("ROLE_ADMIN")}
                            onChange={() => toggleRole("ROLE_ADMIN")}
                            className="h-3 w-3 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-400/30"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300">ROLE_ADMIN</span>
                        </label>
                        <div className="mt-1 flex gap-1">
                          <button
                            onClick={() => saveRoles(user.id)}
                            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditingRoles}
                            className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-900 dark:text-slate-100">{user.groupCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {editingRoles !== user.id && (
                        <button
                          onClick={() => startEditingRoles(user.id, user.roles)}
                          className="flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          title="Edit roles"
                        >
                          <Shield className="h-3 w-3" />
                          Roles
                        </button>
                      )}
                      {user.enabled ? (
                        <button
                          onClick={() => handleDisableUser(user.id)}
                          className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40"
                          title="Disable user"
                        >
                          <UserX className="h-3 w-3" />
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnableUser(user.id)}
                          className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                          title="Enable user"
                        >
                          <UserCheck className="h-3 w-3" />
                          Enable
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                        title="Delete user"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {users.length === 0 && (
          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}

