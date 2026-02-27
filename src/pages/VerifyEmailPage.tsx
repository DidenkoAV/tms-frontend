import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { http } from "@/lib/http";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const [msg, setMsg] = useState<string>("Verifying your email…");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await http.post(`/api/auth/verify?token=${encodeURIComponent(token)}`);
        if (!alive) return;
        setStatus("ok");
        setMsg("Your email has been verified. You can now sign in.");
        // auto-redirect to login for smoothness
        setTimeout(() => nav("/?verified=1", { replace: true }), 1200);
      } catch (e: any) {
        if (!alive) return;
        setStatus("fail");
        setMsg(e?.response?.data?.message || "Verification failed. The link may be expired.");
      }
    })();
    return () => { alive = false; };
  }, [token, nav]);

  return (
    <div className="min-h-screen bg-white grid place-items-center px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 h-16 w-16 rounded-full border border-slate-200 grid place-items-center">
          {status === "loading" && <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />}
          {status === "ok" && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
          {status === "fail" && <XCircle className="h-8 w-8 text-rose-600" />}
        </div>

        {/* Title */}
        <h1 className="mb-2 text-xl font-semibold text-slate-900">
          {status === "ok" ? "Email Verified" : status === "fail" ? "Verification Failed" : "Verifying Email"}
        </h1>

        {/* Message */}
        <p className="text-sm text-slate-600">{msg}</p>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-2">
          {status === "fail" ? (
            <>
              <Link
                to="/"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Go to Login
              </Link>
              <Link
                to="/register"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Register Again
              </Link>
            </>
          ) : status === "ok" ? (
            <Link
              to="/"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Continue to Login
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
