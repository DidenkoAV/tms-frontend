// src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import { http, setAuthToken } from "@/lib/http";
import { useNavigate, Link } from "react-router-dom";
import { useIsolatedTheme } from "@/shared/utils/useIsolatedTheme";

import messagepointLogo from "@/public/logos/logo.svg";

/* --- Messagepoint logo (PNG) --- */
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

/* --- Google "G" --- */
function GoogleG() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden>
      <path fill="#EA4335" d="M9 3.48c1.69 0 2.84.73 3.49 1.34l2.38-2.31C13.66 1.64 11.53.75 9 .75 5.48.75 2.44 2.69 1 5.64l2.86 2.22C4.53 6.14 6.57 3.48 9 3.48z"/>
      <path fill="#4285F4" d="M17.64 9.2c0-.74-.07-1.28-.2-1.84H9v3.34h4.9c-.1.83-.64 2.08-1.84 2.93l2.83 2.2c1.7-1.57 2.75-3.88 2.75-6.63z"/>
      <path fill="#FBBC05" d="M3.86 10.56c-.18-.5-.29-1.02-.29-1.56s.11-1.06.28-1.56L1 5.21A8.25 8.25 0 0 0 .75 9c0 1.3.31 2.53.85 3.79l2.26-2.23z"/>
      <path fill="#34A853" d="M9 17.25c2.53 0 4.66-.83 6.21-2.27l-2.83-2.2c-.76.52-1.78.89-3.38.89-2.43 0-4.47-1.66-5.2-3.98l-2.86 2.22C2.44 15.31 5.48 17.25 9 17.25z"/>
    </svg>
  );
}

export default function LoginPage() {
  useIsolatedTheme({ forceLight: true });

  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get("oauthError") === "1";
  const verified = params.get("verified") === "1";
  const passwordSet = params.get("passwordSet") === "true";
  const emailParam = params.get("email") || "";

  // Pre-fill email if provided
  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Clear any old tokens when landing on login page to prevent "INVALID_CREDENTIALS" flash
  useEffect(() => {
    // Only clear if we're not in the middle of a login attempt
    if (!loading) {
      setAuthToken(null);
    }
  }, []);

  // Map error codes to human-readable messages
  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      "INVALID_CREDENTIALS": "Invalid email or password. Please try again.",
      "USER_NOT_FOUND": "No account found with this email address.",
      "ACCOUNT_DISABLED": "Your account has been disabled. Please contact support.",
      "EMAIL_NOT_VERIFIED": "Please verify your email address before signing in.",
      "TOO_MANY_ATTEMPTS": "Too many login attempts. Please try again later.",
    };
    return errorMessages[errorCode] || errorCode;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data } = await http.post("/api/auth/login", { email, password });
      setAuthToken(data.token);
      // Force full page reload to ensure clean state after login
      window.location.href = "/projects";
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || "Login failed";
      setErr(getErrorMessage(errorMsg));
      setLoading(false);
    }
  }


function resolveApiBaseForOAuth() {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  // 1) If VITE_API_BASE_URL is explicitly set - use it in any environment
  if (envBase && envBase.length > 0) {
    return envBase.replace(/\/+$/, "");
  }

  const host = window.location.hostname;

  // 2) Local development - call backend directly
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8083";
  }

  return "";
}

  
function onGoogle() {
  const apiBase = resolveApiBaseForOAuth();
  window.location.href = `${apiBase}/oauth2/authorization/google`;
}

  return (
    <div className="relative min-h-screen login-scope bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <style>{`
        .login-scope input:-webkit-autofill,
        .login-scope input:-webkit-autofill:hover,
        .login-scope input:-webkit-autofill:focus,
        .login-scope input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="grid px-4 py-10 place-items-center">
        <div className="w-full max-w-md p-8 bg-white border shadow-lg rounded-2xl border-slate-200">
          <div className="grid gap-3 mb-6 place-items-center">
            <MPLogo size={72} />
            <h1 className="text-xl font-semibold text-slate-900">Sign in to Messagepoint TMS</h1>
            <p className="text-sm text-slate-600">Your smart test workspace</p>
          </div>

          {verified && (
            <div
              role="alert"
              className="px-3 py-2 mb-4 text-sm border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              ✓ Email verified successfully! You can now sign in.
            </div>
          )}

          {passwordSet && (
            <div
              role="alert"
              className="px-3 py-2 mb-4 text-sm border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              ✓ Password set successfully! You can now sign in.
            </div>
          )}

          {oauthError && (
            <div
              role="alert"
              className="px-3 py-2 mb-4 text-sm border rounded-lg border-rose-200 bg-rose-50 text-rose-700"
            >
              Google sign-in failed. Please try again.
            </div>
          )}

          {err && (
            <div
              role="alert"
              className="px-3 py-2 mb-4 text-sm border rounded-lg border-rose-200 bg-rose-50 text-rose-700"
            >
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="email"
                className="w-full px-4 py-3 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPw ? "text" : "password"}
                placeholder="password"
                className="w-full px-4 py-3 bg-white border rounded-lg outline-none border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#7c1a87] focus:ring-2 focus:ring-[#7c1a87]/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <div className="mt-1.5 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-slate-500 hover:text-[#7c1a87] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full px-6 py-3 font-semibold text-white rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#7c1a87" }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#6a1675")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#7c1a87")}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google button */}
          <button
            onClick={onGoogle}
            aria-label="Continue with Google"
            className="group relative mx-auto flex w-full items-center justify-center rounded bg-white text-[14px] font-medium transition"
            style={{
              borderColor: "#DADCE0",
              borderWidth: 1,
              borderRadius: 4,
              color: "#3C4043",
              lineHeight: "20px",
              minHeight: 40,
              padding: "10px 16px",
            }}
          >
            <span className="absolute inset-y-0 flex items-center pointer-events-none left-3">
              <GoogleG />
            </span>
            <span className="mx-2">Continue with Google</span>
            <span className="absolute inset-y-0 flex items-center opacity-0 pointer-events-none right-3" aria-hidden>
              <GoogleG />
            </span>
          </button>

          <p className="mt-6 text-sm text-center text-slate-600">
            No account?{" "}
            <Link
              to="/register"
              className="font-medium underline-offset-2 hover:underline"
              style={{ color: "#7c1a87" }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
