// src/features/account/component/groups/GroupsSection.tsx
import { useEffect, useMemo, useState } from "react";
import { http } from "@/lib/http";
import type { GroupDetails, GroupMember, GroupRole, GroupType } from "@/entities/group";
import {
  listMyGroups,
  getGroup,
  createGroup,
  renameGroup as apiRenameGroup,
  deleteGroup,
  inviteMember,
  getPendingInvites,
  cancelInvite as apiCancelInvite,
  changeMemberRole,
  removeMember as apiRemoveMember,
  leaveGroup as apiLeaveGroup,
} from "@/entities/group/api/groupApi";

type Props = {
  CardHeader: React.FC<{ title: string; subtitle?: string; compact?: boolean }>;
  Field: React.FC<{ label: string; children: React.ReactNode }>;
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  ButtonDangerOutline: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
};

type ApiErr = string | null;

export default function GroupsSection({
  CardHeader,
  Field,
  Input,
  ButtonPrimary,
  ButtonDangerOutline,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErr>(null);
  const [groups, setGroups] = useState<GroupDetails[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // create group
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // invite
  const [inviteEmail, setInviteEmail] = useState("");

  // rename
  const [renameValue, setRenameValue] = useState("");
  const [editingName, setEditingName] = useState(false);

  // me
  const [myEmail, setMyEmail] = useState<string | null>(null);

  // toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Show toast helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const selected = useMemo<GroupDetails | null>(() => {
    const byId = groups.find((g) => g.id === selectedId) || null;
    return byId ?? groups[0] ?? null;
  }, [groups, selectedId]);

  // Helper to get display name for personal groups
  const getGroupDisplayName = (g: GroupDetails) => {
    if (g.groupType === "PERSONAL") {
      // Extract name from owner email or use full name if available
      const ownerName = g.ownerEmail.split('@')[0];
      return `Personal — ${ownerName}`;
    }
    return g.name;
  };

  /* ---------- Load me & groups ---------- */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([http.get("/api/auth/me"), listMyGroups()])
      .then(async ([meRes, groupsList]) => {
        if (!alive) return;

        const me = meRes?.data;
        setMyEmail((me?.email || "").toLowerCase());

        setGroups(groupsList);

        const first = groupsList[0];
        if (first) {
          setSelectedId((prev) => prev ?? first.id);
          setRenameValue(first.name);
          try {
            const details = await getGroup(first.id);
            setGroups((prev) => prev.map((g) => (g.id === first.id ? details : g)));
          } catch {
            /* no-op */
          }
        }
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load groups");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  /* ---------- Rights ---------- */
  const myRoleIn = (g: GroupDetails | null): GroupRole | null => {
    if (!g || !myEmail) return null;
    if ((g.ownerEmail || "").toLowerCase() === myEmail) return "OWNER";
    const me = (g.members ?? []).find((m) => (m.email || "").toLowerCase() === myEmail);
    return (me?.role as GroupRole) ?? null;
  };

  const isOwner = (g: GroupDetails | null) => myRoleIn(g) === "OWNER";
  const isAdmin = (g: GroupDetails | null) => myRoleIn(g) === "ADMIN";

  // policy
  const canRename = (g: GroupDetails | null) => g?.groupType === "SHARED" && (isOwner(g) || isAdmin(g));
  const canDelete = (g: GroupDetails | null) => g?.groupType === "SHARED" && isOwner(g);
  const canInvite = (g: GroupDetails | null) => isOwner(g) || isAdmin(g); // ← Теперь можно приглашать в любой тип группы
  const canManageMembers = (g: GroupDetails | null) => isOwner(g) || isAdmin(g); // ← Теперь можно управлять в любом типе

  /* ---------- Actions ---------- */
  const refreshGroup = async (groupId: number) => {
    const details = await getGroup(groupId);
    setGroups((prev) => prev.map((g) => (g.id === groupId ? details : g)));
  };

  const handleCreateGroup = async () => {
    const name = (newGroupName || "").trim();
    if (!name) return;
    try {
      const newGroup = await createGroup(name);
      setGroups((prev) => [...prev, newGroup]);
      setSelectedId(newGroup.id);
      setRenameValue(newGroup.name);
      setNewGroupName("");
      setCreatingGroup(false);
      showToast(`Group "${newGroup.name}" created successfully!`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to create group", "error");
    }
  };

  const invite = async (g: GroupDetails | null) => {
    if (!g) return;
    const email = (inviteEmail || "").trim().toLowerCase();
    if (!email) return;
    try {
      await inviteMember(g.id, email);
      setInviteEmail("");
      await refreshGroup(g.id);
      showToast(`Invitation sent to ${email}`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to invite", "error");
    }
  };

  const handleCancelInvite = async (g: GroupDetails, m: GroupMember) => {
    if (!confirm(`Cancel invite for ${m.email}?`)) return;
    try {
      await apiCancelInvite(g.id, m.id);
      await refreshGroup(g.id);
      showToast(`Invite for ${m.email} cancelled`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to cancel invite", "error");
    }
  };

  const handleRenameGroup = async (g: GroupDetails | null) => {
    if (!g || !canRename(g)) return;
    const next = (renameValue || "").trim();
    if (!next || next === g.name) {
      setEditingName(false);
      return;
    }
    try {
      await apiRenameGroup(g.id, next);
      await refreshGroup(g.id);
      setEditingName(false);
      showToast(`Group renamed to "${next}"`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to rename group", "error");
    }
  };

  const handleDeleteGroup = async (g: GroupDetails) => {
    if (!confirm(`Delete group "${g.name}"? This action cannot be undone.`)) return;
    try {
      await deleteGroup(g.id);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
      setSelectedId((prev) => {
        const next = groups.find((x) => x.id !== g.id)?.id;
        return next ?? null;
      });
      showToast(`Group "${g.name}" deleted`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to delete group", "error");
    }
  };

  const handleRemoveMember = async (g: GroupDetails, m: GroupMember) => {
    if (!confirm(`Remove ${m.email} from "${g.name}"?`)) return;
    try {
      await apiRemoveMember(g.id, m.id);
      await refreshGroup(g.id);
      showToast(`${m.email} removed from group`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to remove member", "error");
    }
  };

  const changeRole = async (g: GroupDetails, m: GroupMember, role: GroupRole) => {
    try {
      await changeMemberRole(g.id, m.id, role);
      await refreshGroup(g.id);
      showToast(`Role changed to ${role}`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to change role", "error");
    }
  };

  const handleLeaveGroup = async (g: GroupDetails) => {
    if (!confirm(`Leave group "${g.name}"?`)) return;
    try {
      await apiLeaveGroup(g.id);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
      setSelectedId((prev) => {
        const next = groups.find((x) => x.id !== g.id)?.id;
        return next ?? null;
      });
      showToast(`You left group "${g.name}"`);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Failed to leave group", "error");
    }
  };

  /* ---------- Badges ---------- */
  const RoleBadge: React.FC<{ role: GroupRole }> = ({ role }) => {
    if (role === "OWNER")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200">
          OWNER
        </span>
      );
    if (role === "ADMIN")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
          ADMIN
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-600/30 dark:text-slate-200">
        MEMBER
      </span>
    );
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const S = status.toUpperCase();
    if (S === "ACTIVE")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
          ACTIVE
        </span>
      );
    if (S === "PENDING")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
          PENDING
        </span>
      );
    if (S === "INACTIVE" || S === "SUSPENDED")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-600/30 dark:text-slate-200">
          {S}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-600/30 dark:text-slate-200">
        {status}
      </span>
    );
  };

  /* ---------- UI ---------- */
  if (loading) return <div>Loading groups…</div>;
  if (error) {
    return (
      <>
        <CardHeader title="Groups" />
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardHeader
          title="Groups"
          subtitle="Manage your personal and shared groups"
          compact
        />
        <button
          onClick={() => setCreatingGroup(true)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Create Group
        </button>
      </div>

      {/* Create Group Modal */}
      {creatingGroup && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-2 text-sm font-medium">Create New Group</div>
          <div className="flex items-center gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateGroup();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setCreatingGroup(false);
                  setNewGroupName("");
                }
              }}
              className="flex-1"
            />
            <ButtonPrimary onClick={handleCreateGroup}>Create</ButtonPrimary>
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
              onClick={() => {
                setCreatingGroup(false);
                setNewGroupName("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        {/* list */}
        <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
          <ul className="space-y-1">
            {groups.map((g) => {
              const active = g.id === selectedId;
              const isPersonal = g.groupType === "PERSONAL";
              return (
                <li key={g.id}>
                  <button
                    className={[
                      "w-full rounded-md px-2 py-1.5 text-left text-sm transition",
                      active ? "bg-slate-100 dark:bg-slate-800/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                    ].join(" ")}
                    onClick={async () => {
                      setSelectedId(g.id);
                      setRenameValue(g.name);
                      setEditingName(false);
                      await refreshGroup(g.id);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[13px]">
                          {getGroupDisplayName(g)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {isPersonal ? (
                            <span className="rounded bg-slate-200 px-1 py-0.5 text-[10px] dark:bg-slate-700">Personal</span>
                          ) : (
                            <span className="rounded bg-indigo-100 px-1 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">Shared</span>
                          )}
                          <span>•</span>
                          <span>{g.members?.length ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {groups.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No groups yet.</li>}
          </ul>
        </div>

        {/* details */}
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          {!selected ? (
            <div className="text-sm text-slate-500">Select a group…</div>
          ) : (
            <>
              {/* --- Header with title, type badge, and actions --- */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  {!editingName ? (
                    <div className="flex items-center gap-2">
                      <h2
                        className={
                          canRename(selected)
                            ? "text-xl font-semibold cursor-text hover:underline underline-offset-2"
                            : "text-xl font-semibold"
                        }
                        title={canRename(selected) ? "Click to rename" : undefined}
                        onClick={() => {
                          if (!canRename(selected)) return;
                          setEditingName(true);
                          setRenameValue(selected.name);
                        }}
                      >
                        {getGroupDisplayName(selected)}
                      </h2>
                      {selected.groupType === "PERSONAL" ? (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          Personal
                        </span>
                      ) : (
                        <span className="rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                          Shared
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRenameGroup(selected);
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingName(false);
                            setRenameValue(selected.name);
                          }
                        }}
                        className="flex-1"
                      />
                      <ButtonPrimary onClick={() => handleRenameGroup(selected)}>Save</ButtonPrimary>
                      <button
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                        onClick={() => {
                          setEditingName(false);
                          setRenameValue(selected.name);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    Owner: {selected.ownerEmail}
                  </div>
                </div>

                {/* Delete button for SHARED groups */}
                {canDelete(selected) && (
                  <button
                    onClick={() => handleDeleteGroup(selected)}
                    className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                  >
                    Delete Group
                  </button>
                )}
              </div>

              {/* invite — available for both PERSONAL and SHARED groups */}
              {canInvite(selected) && (
                <div className="mb-3">
                  <div className="mb-1 text-[13px] font-medium">Invite Member</div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="flex-1"
                    />
                    <button
                      onClick={() => invite(selected!)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              )}

              {/* members */}
              <div>
                <div className="mb-2 text-[13px] font-medium">Members ({selected.members?.length ?? 0})</div>
                <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-[13px]">
                    <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-semibold">User</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Role</th>
                        <th className="px-2 py-1.5 text-left font-semibold">Status</th>
                        {canManageMembers(selected) && <th className="px-2 py-1.5 text-right font-semibold">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.members ?? []).map((m) => {
                        const isActive = m.status === "ACTIVE";
                        const isOwnerRow = m.role === "OWNER" && m.userId === selected.ownerId;

                        return (
                          <tr key={m.id} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="px-2 py-1.5">
                              <div className="font-medium text-[13px]">{m.fullName || m.email}</div>
                              <div className="text-[11px] text-slate-500">{m.email}</div>
                            </td>

                            {/* Role: dropdown for SHARED groups with permissions */}
                            <td className="px-2 py-1.5">
                              {canManageMembers(selected) && isActive && !isOwnerRow ? (
                                <select
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                                  value={m.role}
                                  onChange={(e) =>
                                    changeRole(selected, m, e.target.value as GroupRole)
                                  }
                                  title="Change role"
                                >
                                  <option value="MEMBER">MEMBER</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="OWNER" disabled>OWNER</option>
                                </select>
                              ) : (
                                <RoleBadge role={m.role as GroupRole} />
                              )}
                            </td>

                            <td className="px-2 py-1.5">
                              <StatusBadge status={m.status} />
                            </td>

                            {canManageMembers(selected) && (
                              <td className="px-2 py-1.5 text-right">
                                {!isOwnerRow && (
                                  <>
                                    {isActive && (
                                      <button
                                        onClick={() => handleRemoveMember(selected, m)}
                                        className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                                      >
                                        Remove
                                      </button>
                                    )}
                                    {m.status === "PENDING" && (
                                      <button
                                        onClick={() => handleCancelInvite(selected, m)}
                                        className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {(selected.members ?? []).length === 0 && (
                        <tr>
                          <td className="px-2 py-1.5 text-[13px] text-slate-500" colSpan={canManageMembers(selected) ? 4 : 3}>
                            No members yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* leave - only for non-owners */}
                {!isOwner(selected) && (
                  <div className="mt-2">
                    <button
                      onClick={() => handleLeaveGroup(selected!)}
                      className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                    >
                      Leave Group
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={[
            "fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all",
            toast.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
              : "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
          ].join(" ")}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
