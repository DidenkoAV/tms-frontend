import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { http } from "@/lib/http";
import { useIsolatedTheme } from "@/shared/utils/useIsolatedTheme";
import messagepointLogo from "@/public/logos/logo.svg";

/* --- Messagepoint logo --- */
function MPLogo({ size = 64 }: { size?: number }) {
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

export default function ResetPasswordPage() {
  useIsolatedTheme({ forceLight: true });

  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    // Validation
    if (!password) {
      setErr("Password is required");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    if (!token) {
      setErr("Invalid or missing reset token");
      return;
    }

    setLoading(true);
    try {
      await http.post(`/api/auth/password/reset?token=${encodeURIComponent(token)}`, {
        newPassword: password,
      });
      setSuccess(true);
      // Auto-redirect to login after 2 seconds
      setTimeout(() => nav("/?reset=1", { replace: true }), 2000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to reset password. The link may be expired.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <style>{`
          body { background: #f8fafc !important; }
        `}</style>

        <div className="grid px-4 py-10 place-items-center">
          <div className="w-full max-w-md p-8 bg-white border shadow-lg rounded-2xl border-slate-200 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 grid place-items-center">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-slate-900">Password Reset</h1>
            <p className="text-slate-600">Your password has been successfully reset. You can now sign in with your new password.</p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-block px-6 py-3 font-semibold text-white rounded-lg"
                style={{ backgroundColor: "#7c1a87" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6a1675")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7c1a87")}
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        body { background: #f8fafc !important; }

        /* Remove autofill background */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="grid px-4 py-10 place-items-center">
        <div className="w-full max-w-md p-8 bg-white border shadow-lg rounded-2xl border-slate-200">
          <div className="grid gap-3 mb-6 place-items-center">
            <MPLogo size={72} />
            <h1 className="text-xl font-semibold text-slate-900">Reset Password</h1>
            <p className="text-sm text-slate-600">Enter your new password below</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Enter new password"
                disabled={loading}
                autoFocus
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPw ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Confirm new password"
                disabled={loading}
                required
                autoComplete="new-password"
              />
            </div>

            {err && (
              <div
                role="alert"
                className="px-3 py-2 text-sm border rounded-lg border-rose-200 bg-rose-50 text-rose-700"
              >
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 font-semibold text-white rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#7c1a87" }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#6a1675")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#7c1a87")}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-sm text-center text-slate-600">
            Remember your password?{" "}
            <Link
              to="/"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: "#7c1a87" }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

