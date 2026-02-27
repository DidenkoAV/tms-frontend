import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { http, setAuthToken } from "@/lib/http";

export default function InviteAcceptedPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const needsPassword = search.get("needsPassword") === "true";
  const email = search.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-redirect for existing users
  useEffect(() => {
    if (!needsPassword) {
      const timer = setTimeout(() => {
        navigate("/account?tab=groups", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [needsPassword, navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Set password for the new user - backend should return auth token
      console.log("=== SET PASSWORD REQUEST ===");
      console.log("Email from URL:", email);
      console.log("Password length:", password.length);
      console.log("Request payload:", { email, password: "***" });

      if (!email) {
        setError("Email is missing. Please use the link from your invitation email.");
        setLoading(false);
        return;
      }

      const { data } = await http.post("/api/auth/password/set", {
        email,
        password
      });

      console.log("=== SET PASSWORD RESPONSE ===");
      console.log("Response data:", data);

      // If backend returns a token, set it and redirect to groups
      if (data.token) {
        setAuthToken(data.token);
        // Force full page reload to ensure clean state after auto-login
        window.location.href = "/account?tab=groups";
      } else {
        // Fallback: redirect to login if no token returned
        navigate("/?passwordSet=true&email=" + encodeURIComponent(email), { replace: true });
      }
    } catch (e: any) {
      console.error("Password set error:", e);
      console.error("Error response:", e?.response?.data);

      const errorMsg = e?.response?.data?.message ||
                      e?.response?.data?.error ||
                      e?.message ||
                      "Failed to set password";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-white grid place-items-center px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          {/* Icon */}
          <div className="mx-auto mb-6 h-16 w-16 rounded-full border border-slate-200 grid place-items-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          {/* Title */}
          <h1 className="mb-2 text-xl font-semibold text-slate-900 text-center">
            Invitation Accepted!
          </h1>

          {/* Message */}
          <p className="text-sm text-slate-600 mb-6 text-center">
            Please set your password to access the group.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 text-sm border rounded-lg border-rose-200 bg-rose-50 text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSetPassword} className="space-y-4">
            {email && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting password..." : "Set Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Existing user - just show success and redirect
  return (
    <div className="min-h-screen bg-white grid place-items-center px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 h-16 w-16 rounded-full border border-slate-200 grid place-items-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-xl font-semibold text-slate-900">
          Invitation Accepted!
        </h1>

        {/* Message */}
        <p className="text-sm text-slate-600 mb-6">
          Redirecting to your groups...
        </p>
      </div>
    </div>
  );
}

