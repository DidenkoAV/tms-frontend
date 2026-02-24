import { useOutletContext } from "react-router-dom";
import type { AppOutletCtx } from "@/app/types";

export default function DebugMePage() {
  const { me, authed } = useOutletContext<AppOutletCtx>();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Debug: Current User Info
        </h1>
        
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Authed:</div>
              <div className="text-lg text-slate-900 dark:text-slate-100">{String(authed)}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Full Name:</div>
              <div className="text-lg text-slate-900 dark:text-slate-100">{me?.fullName || "null"}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Email:</div>
              <div className="text-lg text-slate-900 dark:text-slate-100">{me?.email || "null"}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Roles:</div>
              <div className="text-lg text-slate-900 dark:text-slate-100">
                {me?.roles ? JSON.stringify(me.roles) : "undefined"}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Has ROLE_ADMIN:</div>
              <div className="text-lg text-slate-900 dark:text-slate-100">
                {String(me?.roles?.includes("ROLE_ADMIN"))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Full me object:</div>
              <pre className="mt-2 rounded bg-slate-100 p-4 text-xs text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                {JSON.stringify(me, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

