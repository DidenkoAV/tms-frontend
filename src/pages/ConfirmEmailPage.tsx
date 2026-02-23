import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { http } from "@/lib/http";

export default function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const [msg, setMsg] = useState<string>("Confirming your new email address…");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await http.post(`/api/auth/email/confirm?token=${encodeURIComponent(token)}`);
        if (!alive) return;
        setStatus("ok");
        setMsg("Your email address has been successfully updated.");
        // Auto-redirect to account page after 2 seconds
        setTimeout(() => nav("/account?email-confirmed=1", { replace: true }), 2000);
      } catch (e: any) {
        if (!alive) return;
        setStatus("fail");
        setMsg(e?.response?.data?.message || "Email confirmation failed. The link may be expired.");
      }
    })();
    return () => { alive = false; };
  }, [token, nav]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f1a] to-[#1a1f36] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/60 bg-[#0f1524]/80 p-8 backdrop-blur-xl text-center shadow-2xl shadow-cyan-400/10">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 grid place-items-center">
          {status === "loading" && <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          {status === "ok" && <span className="text-3xl">✅</span>}
          {status === "fail" && <span className="text-3xl">⚠️</span>}
        </div>
        <h1 className="mb-2 text-2xl font-semibold">
          {status === "ok" ? "Email Confirmed" : status === "fail" ? "Confirmation Error" : "Please wait…"}
        </h1>
        <p className="text-slate-300">{msg}</p>

        <div className="mt-6">
          {status === "fail" ? (
            <div className="space-x-2">
              <Link to="/" className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 hover:border-slate-500">
                Go to Login
              </Link>
              <Link to="/account" className="rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-medium text-white">
                Go to Account
              </Link>
            </div>
          ) : (
            <Link to="/account" className="rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-medium text-white">
              Continue
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

