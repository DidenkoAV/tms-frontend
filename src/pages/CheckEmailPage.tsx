import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { http } from "@/lib/http";

function providerLink(email?: string | null) {
  const domain = (email || "").split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain.includes("gmail")) return "https://mail.google.com";
  if (domain.includes("yahoo")) return "https://mail.yahoo.com";
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live"))
    return "https://outlook.live.com/mail/0/inbox";
  if (domain.includes("yandex")) return "https://mail.yandex.ru";
  return null;
}

export default function CheckEmailPage() {
  const [params] = useSearchParams();
  const email = params.get("email");
  const link = useMemo(() => providerLink(email), [email]);

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function resend() {
    if (!email) return;
    setLoading(true); setMsg(null);
    try {
      await http.post("/api/auth/verify-email/resend", { email });
      setMsg("If the account exists, we sent a new email.");
      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Unable to resend right now");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f1a] to-[#1a1f36] grid place-items-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800/60 bg-[#0f1524]/80 p-8 backdrop-blur-xl shadow-2xl shadow-cyan-400/10">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
            ✉️
          </div>
          <h1 className="text-2xl font-semibold">Check your inbox</h1>
        </div>

        <p className="text-slate-300">
          We’ve sent a confirmation link to <span className="font-semibold text-cyan-300">{email || "your email"}</span>.
          Click the link to verify your account.
        </p>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          >
            Open mailbox
          </a>
        )}

        <div className="mt-6">
          <div className="text-sm text-slate-400">Didn’t get the email?</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={resend}
              disabled={!email || loading || cooldown > 0}
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
            </button>
            <Link to="/register" className="text-sm text-slate-300 hover:underline">Change email</Link>
          </div>
          {msg && <div className="mt-2 text-sm text-slate-300">{msg}</div>}
        </div>

        <div className="mt-6 text-sm text-slate-400">
          Already verified? <Link to="/" className="text-cyan-300 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
