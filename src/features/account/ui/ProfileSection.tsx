// src/features/account/component/profile/ProfileSection.tsx
import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import type { Me } from "@/entities/group";
import { CalendarIcon, ShieldCheckIcon } from "lucide-react";

type ProfileSectionProps = {
  me: Me | null;
  setMe: React.Dispatch<React.SetStateAction<Me | null>>;
  CardHeader: (props: { title: string; subtitle?: string; compact?: boolean }) => React.ReactElement;
  Field: (props: { label: string; children: React.ReactNode }) => React.ReactElement;
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => React.ReactElement;
  ButtonPrimary: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactElement;
};

export default function ProfileSection({
  me,
  setMe,
  CardHeader,
  Field,
  Input,
  ButtonPrimary,
}: ProfileSectionProps) {
  const [nameEdit, setNameEdit] = useState("");
  const [emailEdit, setEmailEdit] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "warn" | "err"; text: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  useEffect(() => {
    if (me) {
      setNameEdit(me.fullName || "");
      setEmailEdit(me.email || "");
    }
  }, [me]);

  const emailChanged = !!me && emailEdit.trim().toLowerCase() !== (me.email || "").trim().toLowerCase();
  const nameChanged = !!me && nameEdit.trim() !== (me.fullName || "");
  const canSaveName = !!me && nameChanged && !savingProfile;
  const canSaveEmail = !!me && emailChanged && !savingProfile;

  function isEmailValid(v: string) {
    const x = v.trim();
    if (!x) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !nameChanged) return;
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await http.post("/api/auth/profile/full-name", { fullName: nameEdit.trim() });
      setMe((prev) => (prev ? { ...prev, fullName: nameEdit.trim() } : prev));
      setProfileMsg({ type: "ok", text: "Name updated successfully." });
      setIsEditingName(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update name";
      setProfileMsg({ type: "err", text: msg });
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !emailChanged) return;
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const next = emailEdit.trim();
      if (!isEmailValid(next)) throw new Error("Invalid email format");
      await http.post("/api/auth/profile/email/change", { newEmail: next });
      // keep original in input (change will apply after confirmation)
      setEmailEdit(me.email || "");
      setProfileMsg({
        type: "ok",
        text: `Confirmation link was sent to ${next}. Please check your inbox to complete the email change.`,
      });
      setIsEditingEmail(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update email";
      setProfileMsg({ type: "err", text: msg });
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelName() {
    setIsEditingName(false);
    if (me) {
      setNameEdit(me.fullName || "");
    }
    setProfileMsg(null);
  }

  function handleCancelEmail() {
    setIsEditingEmail(false);
    if (me) {
      setEmailEdit(me.email || "");
    }
    setProfileMsg(null);
  }

  function formatJoinDate(dateString: string) {
    const d = new Date(dateString);
    const date = d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  }

  return (
    <>
      <CardHeader title="Profile" subtitle="Update your name and email." />

      {profileMsg && (
        <div
          className={[
            "mb-3 rounded-lg border px-3 py-2 text-sm",
            profileMsg.type === "ok" &&
              "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200",
            profileMsg.type === "warn" &&
              "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
            profileMsg.type === "err" &&
              "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200",
          ].join(" ")}
        >
          {profileMsg.text}
        </div>
      )}

      {/* Name field */}
      <form onSubmit={saveName}>
        <Field label="Full name">
          <div className="flex items-start gap-2">
            <div className="flex-1 max-w-md">
              <Input
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                placeholder="Your name"
                disabled={!isEditingName}
              />
            </div>
            <div className="flex shrink-0 gap-2 pt-[3px]">
              {!isEditingName ? (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Change
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={!canSaveName}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {savingProfile ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelName}
                    className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </Field>
      </form>

      {/* Email field */}
      <form onSubmit={saveEmail}>
        <Field label="Email">
          <div className="flex items-start gap-2">
            <div className="flex-1 max-w-md">
              <Input
                type="email"
                value={emailEdit}
                onChange={(e) => setEmailEdit(e.target.value)}
                placeholder="you@example.com"
                disabled={!isEditingEmail}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                Changing email will send a confirmation link to the new address.
              </p>
            </div>
            <div className="flex shrink-0 gap-2 pt-[3px]">
              {!isEditingEmail ? (
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(true)}
                  className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Change
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={!canSaveEmail}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {savingProfile ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEmail}
                    className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </Field>
      </form>

      {me && (
        <div className="p-3 mt-4 text-sm border rounded-lg border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div className="flex flex-wrap items-center gap-1">
                <b className="text-slate-600 dark:text-slate-400">Role:</b>
                {me.roles?.length ? (
                  me.roles.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center rounded-md border border-slate-300 bg-white/80 px-2 py-[1px] text-[12px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {r.replace(/^ROLE_/, "")}
                    </span>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>

            {me.createdAt && (
              <div className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-400">
                <CalendarIcon className="w-4 h-4 opacity-80" />
                <span>
                  <b className="text-slate-600 dark:text-slate-400">Joined:</b>{" "}
                  {formatJoinDate(me.createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
