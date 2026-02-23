// src/pages/RegisterPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "@/lib/http";

import messagepointLogo from "@/public/logos/logo.svg";

function MPLogo({ size = 72 }: { size?: number }) {
  return (
    <span
      className="inline-grid transition-transform duration-300 bg-white shadow-sm place-items-center rounded-2xl ring-1 ring-slate-200 hover:scale-105"
      style={{ width: size, height: size }}
    >
      <img
        src={messagepointLogo}
        alt="Messagepoint Logo"
        className="w-[75%] h-[75%] object-contain"
      />
    </span>
  );
}

function strengthScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}

export default function RegisterPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const score = strengthScore(password);
  const canSubmit =
    fullName.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8 &&
    password === confirm &&
    !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null); setOk(null); setLoading(true);
    try {
      await http.post("/api/auth/register", { email, password, fullName });
      setOk("Registration successful! We've sent a confirmation link to your email. Please check your inbox.");
      // Очистка формы после успешной регистрации
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen register-scope bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <style>{`
        .register-scope input:-webkit-autofill,
        .register-scope input:-webkit-autofill:hover,
        .register-scope input:-webkit-autofill:focus,
        .register-scope input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="grid px-4 py-10 place-items-center">
        <div className="w-full max-w-md p-8 bg-white border shadow-lg rounded-2xl border-slate-200">
          <div className="grid gap-3 mb-6 place-items-center">
            <MPLogo size={72} />
            <h1 className="text-xl font-semibold text-slate-900">Sign up to Messagepoint TMS</h1>
            <p className="text-sm text-slate-600">Your smart test workspace</p>
          </div>

          {err && (
            <div className="px-3 py-2 mb-4 text-sm border rounded-lg border-rose-200 bg-rose-50 text-rose-700">
              {err}
            </div>
          )}
          {ok && (
            <div className="px-3 py-2 mb-4 text-sm border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700">
              {ok}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pl-10 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20"
                  placeholder="Ada Lovelace"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <span className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 text-slate-400">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full px-4 py-3 pl-10 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 text-slate-400">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2-8 5-8-5v12h16V6Z"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-4 py-3 pl-10 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 text-slate-400">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6-6V9a6 6 0 0 0-12 0v2H4v10h16V11h-2Zm-8-2a4 4 0 0 1 8 0v2H10V9Z"/>
                  </svg>
                </span>
              </div>

              {/* Strength meter */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={[
                    "h-full transition-all",
                    score <= 1 ? "bg-rose-500" : score === 2 ? "bg-amber-400" : score === 3 ? "bg-emerald-500" : "bg-cyan-500",
                  ].join(" ")}
                  style={{ width: `${(score / 4) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong"}
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {confirm && confirm !== password && (
                <div className="mt-1 text-xs text-rose-500">Passwords don’t match</div>
              )}
            </div>

            <button
              disabled={!canSubmit}
              className="w-full px-6 py-3 font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#7c1a87" }}
              onMouseEnter={(e) => !loading && canSubmit && (e.currentTarget.style.backgroundColor = "#6a1675")}
              onMouseLeave={(e) => !loading && canSubmit && (e.currentTarget.style.backgroundColor = "#7c1a87")}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>

            <p className="text-sm text-center text-slate-600">
              Already have an account?{" "}
              <Link to="/" className="font-medium underline-offset-2 hover:underline" style={{ color: "#7c1a87" }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
