// src/features/account/password/PasswordSection.tsx
import { useMemo, useState } from "react";
import { changePassword } from "@/entities/group";
import { pwScore, validateNewPw } from "./utils";
import { CheckCircle2Icon, XCircleIcon, Shield, AlertCircle } from "lucide-react";

type Props = {
  email?: string | null;
  fullName?: string | null;
  Field: React.FC<{ label: string; children: React.ReactNode }>;
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  CardHeader: React.FC<{ title: string; subtitle?: string }>;
};

export default function PasswordSection({
  email,
  fullName,
  Field,
  Input,
  ButtonPrimary,
  CardHeader,
}: Props) {
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const score = useMemo(() => pwScore(newPw), [newPw]);
  const pwErrors = useMemo(
    () => validateNewPw(newPw, { email: email || undefined, name: fullName || undefined }),
    [newPw, email, fullName]
  );
  const canSubmit =
    !!curPw && !!newPw && newPw === newPw2 && pwErrors.length === 0 && !saving;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || newPw !== newPw2) return alert("Passwords do not match");
    if (pwErrors.length) return alert("Please satisfy password requirements");

    setSaving(true);
    try {
      await changePassword(curPw, newPw);
      setCurPw("");
      setNewPw("");
      setNewPw2("");
      alert("Password successfully changed.");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 429
          ? "Password change limit reached. Try again later."
          : "Failed to change password");
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Requirements ---------- */
  const reqs = [
    { label: "At least 8 characters", ok: newPw.length >= 8 },
    { label: "Upper & lower case", ok: /[a-z]/.test(newPw) && /[A-Z]/.test(newPw) },
    { label: "At least one digit", ok: /\d/.test(newPw) },
    { label: "At least one symbol", ok: /[^A-Za-z0-9]/.test(newPw) },
    {
      label: "No email or name included",
      ok: pwErrors.every((e) => !/email|name/i.test(e)),
    },
  ];

  const progressColor =
    score.level === "Weak"
      ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"
      : score.level === "Medium"
      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
      : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]";

  const strengthIcon =
    score.level === "Weak" ? (
      <AlertCircle className="w-4 h-4 text-rose-500" />
    ) : score.level === "Medium" ? (
      <Shield className="w-4 h-4 text-amber-500" />
    ) : (
      <Shield className="w-4 h-4 text-emerald-500" />
    );

  return (
    <>
      <CardHeader title="Password" subtitle="Change your account password." />
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Current password */}
        <Field label="Current password">
          <Input
            type="password"
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
            placeholder="Enter current password"
          />
        </Field>

        {/* New password */}
        <Field label="New password">
          <Input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Enter new password"
          />

          {!!newPw && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Strength */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {strengthIcon}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Strength
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    score.level === "Weak"
                      ? "text-rose-600"
                      : score.level === "Medium"
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {score.level}
                </span>
              </div>

              {/* Bar */}
              <div className="relative w-full h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`absolute top-0 left-0 h-full ${progressColor} transition-all duration-500 ease-out`}
                  style={{ width: `${score.pct}%` }}
                />
              </div>

              {/* Compact requirements */}
              <div className="mt-3 space-y-2">
                <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Requirements
                </div>

                <ul className="flex flex-wrap gap-2">
                  {reqs.map((r, i) => (
                    <li
                      key={r.label}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all duration-300 ${
                        r.ok
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70"
                          : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100/30"
                      } animate-fade-in`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {r.ok ? (
                        <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Field>

        {/* Confirm password */}
        <Field label="Confirm new password">
          <Input
            type="password"
            value={newPw2}
            onChange={(e) => setNewPw2(e.target.value)}
            placeholder="Confirm new password"
          />
          {!!newPw2 && newPw !== newPw2 && (
            <div className="flex items-center gap-2 px-3 py-2 mt-2 text-sm border rounded-lg border-rose-200 bg-rose-50/80 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300 animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              <span>Passwords do not match</span>
            </div>
          )}
        </Field>

        {/* Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>

    </>
  );
}
