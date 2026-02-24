// src/features/account/component/groups/GroupsSection.tsx
import { useEffect, useMemo, useState } from "react";
import { http } from "@/lib/http";
import type { GroupDetails, GroupMember, GroupRole } from "@/entities/group";

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

  // invite
  const [inviteEmail, setInviteEmail] = useState("");

  // rename
  const [renameValue, setRenameValue] = useState("");
  const [editingName, setEditingName] = useState(false);

  // me
  const [myEmail, setMyEmail] = useState<string | null>(null);

  const selected = useMemo<GroupDetails | null>(() => {
    const byId = groups.find((g) => g.id === selectedId) || null;
    return byId ?? groups[0] ?? null;
  }, [groups, selectedId]);

  /* ---------- Load me & groups ---------- */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([http.get("/api/auth/me"), http.get("/api/groups/my")])
      .then(async ([meRes, groupsRes]) => {
        if (!alive) return;

        const me = meRes?.data;
        setMyEmail((me?.email || "").toLowerCase());

        const list = Array.isArray(groupsRes.data) ? (groupsRes.data as GroupDetails[]) : [];
        setGroups(list);

        const first = list[0];
        if (first) {
          setSelectedId((prev) => prev ?? first.id);
          setRenameValue(first.name);
          try {
            const { data } = await http.get(`/api/groups/${first.id}`);
            setGroups((prev) => prev.map((g) => (g.id === first.id ? (data as GroupDetails) : g)));
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
  const isMyPersonal = (g: GroupDetails | null) =>
    !!g && !!g.personal && myEmail && (g.ownerEmail || "").toLowerCase() === myEmail;

  const isOwner = (g: GroupDetails | null) => myRoleIn(g) === "OWNER";
  const isMaintainer = (g: GroupDetails | null) => myRoleIn(g) === "MAINTAINER";

  // policy
  const canRename = (g: GroupDetails | null) => isOwner(g) || isMaintainer(g); // OWNER + MAINTAINER
  const canManageMembers = (g: GroupDetails | null) => isOwner(g); // OWNER only

  /* ---------- Actions ---------- */
  const refreshGroup = async (groupId: number) => {
    const { data } = await http.get(`/api/groups/${groupId}`);
    setGroups((prev) => prev.map((g) => (g.id === groupId ? (data as GroupDetails) : g)));
  };

  const invite = async (g: GroupDetails | null) => {
    if (!g) return;
    const email = (inviteEmail || "").trim().toLowerCase();
    if (!email) return;
    try {
      await http.post(`/api/groups/${g.id}/members`, { email });
      setInviteEmail("");
      await refreshGroup(g.id);
      alert("Invitation sent (or refreshed).");
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to invite");
    }
  };

  const resendInvite = async (g: GroupDetails, m: GroupMember) => {
    try {
      await http.post(`/api/groups/${g.id}/invites/resend`, { email: m.email });
      await refreshGroup(g.id);
      alert("Invitation re-sent.");
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to resend");
    }
  };

  const cancelInvite = async (g: GroupDetails, m: GroupMember) => {
    if (!confirm(`Cancel invite for ${m.email}?`)) return;
    try {
      await http.delete(`/api/groups/${g.id}/invites/${m.id}`);
      await refreshGroup(g.id);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to cancel invite");
    }
  };

  const renameGroup = async (g: GroupDetails | null) => {
    if (!g || !canRename(g)) return;
    const next = (renameValue || "").trim();
    if (!next || next === g.name) {
      setEditingName(false);
      return;
    }
    try {
      await http.patch(`/api/groups/${g.id}`, { name: next });
      await refreshGroup(g.id);
      setEditingName(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to rename group");
    }
  };

  const removeMember = async (g: GroupDetails, m: GroupMember) => {
    if (!confirm(`Remove ${m.email} from "${g.name}"?`)) return;
    try {
      await http.delete(`/api/groups/${g.id}/members/${m.id}`);
      await refreshGroup(g.id);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to remove member");
    }
  };

  const changeRole = async (g: GroupDetails, m: GroupMember, role: GroupRole) => {
    try {
      await http.patch(`/api/groups/${g.id}/members/${m.id}`, { role });
      await refreshGroup(g.id);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to change role");
    }
  };

  const leaveGroup = async (g: GroupDetails) => {
    if (!confirm(`Leave group "${g.name}"?`)) return;
    try {
      await http.post(`/api/groups/${g.id}/leave`);
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
      setSelectedId((prev) => {
        const next = groups.find((x) => x.id !== g.id)?.id;
        return next ?? null;
      });
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to leave group");
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
    if (role === "MAINTAINER")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
          MAINTAINER
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
    <div className="space-y-6">
      <CardHeader
        title="Groups"
        subtitle="Your account has one personal group (created automatically). You can invite members and manage roles according to your permissions."
      />

      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        {/* list */}
        <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
          <ul className="space-y-1">
            {groups.map((g) => {
              const active = g.id === selectedId;
              return (
                <li key={g.id}>
                  <button
                    className={[
                      "w-full rounded-md px-3 py-2 text-left text-sm transition",
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
                      <div>
                        <div className="font-medium">
                          {g.name}{" "}
                          {isMyPersonal(g) && (
                            <span className="ml-1 text-[10px] opacity-60">(personal)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {g.membersCount} members • owner: {g.ownerEmail}
                        </div>
                      </div>
                      <div className="text-[10px] rounded bg-slate-200/60 px-1.5 py-0.5 dark:bg-slate-700/60">
                        #{g.id}
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
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          {!selected ? (
            <div className="text-sm text-slate-500">Select a group…</div>
          ) : (
            <>
              {/* --- Pretty title + inline rename --- */}
              <div className="mb-4">
                {!editingName ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className={
                        canRename(selected)
                          ? "text-2xl font-semibold tracking-tight cursor-text hover:underline underline-offset-4"
                          : "text-2xl font-semibold tracking-tight"
                      }
                      title={canRename(selected) ? "Click to rename" : undefined}
                      onClick={() => {
                        if (!canRename(selected)) return;
                        setEditingName(true);
                        setRenameValue(selected.name);
                      }}
                    >
                      {selected.name}
                    </h2>
                    {isMyPersonal(selected) && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700/30 dark:text-slate-200">
                        personal
                      </span>
                    )}
                    {canRename(selected) && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                        (click name to edit)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          renameGroup(selected);
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setEditingName(false);
                          setRenameValue(selected.name);
                        }
                      }}
                    />
                    <ButtonPrimary onClick={() => renameGroup(selected)}>Save</ButtonPrimary>
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                      onClick={() => {
                        setEditingName(false);
                        setRenameValue(selected.name);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* invite — only who can manage members (OWNER) */}
              {canManageMembers(selected) && (
                <div className="mb-4">
                  <Field label="Invite member by email">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 max-w-md">
                        <Input
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div className="flex shrink-0 gap-2 pt-[3px]">
                        <button
                          onClick={() => invite(selected!)}
                          className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Invite
                        </button>
                      </div>
                    </div>
                  </Field>
                </div>
              )}

              {/* members */}
              <div>
                <div className="mb-2 text-sm font-medium">Members</div>
                <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">User</th>
                        <th className="px-3 py-2 text-left font-semibold">Role</th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                        <th className="px-3 py-2 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.members ?? []).map((m) => {
                        const isActive = m.status === "ACTIVE";
                        const isOwnerRow = m.role === "OWNER" && m.userId === selected.ownerId;

                        return (
                          <tr key={m.id} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="px-3 py-2">
                              <div className="font-medium">{m.fullName || m.email}</div>
                              <div className="text-xs text-slate-500">{m.email}</div>
                            </td>

                            {/* Role: pretty dropdown for allowed cases; otherwise a badge */}
                            <td className="px-3 py-2">
                              {canManageMembers(selected) && isActive && !isOwnerRow ? (
                                <div className="relative inline-block">
                                  <select
                                    className="
                                      appearance-none pr-8
                                      rounded-2xl border px-3 py-1.5 text-xs font-semibold tracking-wide
                                      border-slate-400/50 bg-slate-100/20 text-slate-900
                                      hover:bg-slate-100/30 hover:border-slate-300/60
                                      focus:outline-none focus:ring-2 focus:ring-sky-400/30
                                      dark:text-slate-100 dark:border-slate-600/50 dark:bg-slate-800/60
                                      dark:hover:bg-slate-800/80
                                    "
                                    value={m.role}
                                    onChange={(e) =>
                                      changeRole(selected, m, e.target.value as GroupRole)
                                    }
                                    title="Change role"
                                  >
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="MAINTAINER">MAINTAINER</option>
                                    <option value="OWNER" disabled>
                                      OWNER
                                    </option>
                                  </select>
                                  {/* caret */}
                                  <svg
                                    className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path d="M5.5 7.5l4.5 4.5 4.5-4.5" />
                                  </svg>
                                </div>
                              ) : (
                                <RoleBadge role={m.role as GroupRole} />
                              )}
                            </td>

                            <td className="px-3 py-2">
                              <StatusBadge status={m.status} />
                            </td>

                            <td className="px-3 py-2 text-right">
                              {canManageMembers(selected) && !isOwnerRow && (
                                <>
                                  {isActive && (
                                    <button
                                      onClick={() => removeMember(selected, m)}
                                      className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                                    >
                                      Remove
                                    </button>
                                  )}
                                  {m.status === "PENDING" && (
                                    <div className="inline-flex gap-2">
                                      <button
                                        className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                        onClick={() => resendInvite(selected, m)}
                                      >
                                        Resend
                                      </button>
                                      <button
                                        onClick={() => cancelInvite(selected, m)}
                                        className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(selected.members ?? []).length === 0 && (
                        <tr>
                          <td className="px-3 py-2 text-sm text-slate-500" colSpan={4}>
                            No members yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* leave */}
                <div className="mt-3">
                  {!isOwner(selected) && (
                    <button
                      onClick={() => leaveGroup(selected!)}
                      className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                    >
                      Leave group
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
