import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Entities (new structure)
import { acceptGroupInvite } from "@/entities/group";
import { http } from "@/lib/http";

export default function GroupInviteAcceptPage() {
  const [search] = useSearchParams();
  const token = search.get("token") || "";
  const [status, setStatus] = useState<"idle"|"ok"|"error"|"auth">("idle");
  const [message, setMessage] = useState<string>("Accepting invitation…");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Missing invitation token.");
        return;
      }
      try {
        await acceptGroupInvite(token);
        if (!alive) return;
        setStatus("ok");
        setMessage("Invitation accepted! Redirecting…");
        setTimeout(() => navigate("/account?tab=groups", { replace: true }), 1200);
      } catch (e: any) {
        if (!alive) return;
        const code = e?.response?.status;
        const msg  = e?.response?.data?.message || e?.message || "Failed to accept invitation";
        if (code === 401) {
          // unauthorized - send to login and return back
          setStatus("auth");
          setMessage("Please sign in to accept the invite.");
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          setTimeout(() => window.location.assign(`/?next=${next}`), 900);
        } else {
          setStatus("error");
          setMessage(msg);
        }
      }
    }
    run();

    return () => { alive = false; };
  }, [token, navigate]);

  const box =
    "mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-5 text-slate-800 shadow-sm " +
    "dark:border-slate-800 dark:bg-[#0f1524] dark:text-slate-100";

  return (
    <div className="px-4">
      <div className={box}>
        <h1 className="mb-2 text-lg font-semibold">Group invitation</h1>
        <p className={
          status === "ok" ? "text-emerald-600 dark:text-emerald-300" :
          status === "error" ? "text-rose-600 dark:text-rose-300" :
          status === "auth" ? "text-amber-600 dark:text-amber-300" :
          "text-slate-600 dark:text-slate-300"
        }>
          {message}
        </p>
        {status === "error" && (
          <div className="mt-3 text-sm">
            You can go back to <a className="underline" href="/account?tab=groups">Account → Groups</a>.
          </div>
        )}
      </div>
    </div>
  );
}
