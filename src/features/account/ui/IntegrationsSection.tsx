// src/features/account/component/integrations/IntegrationsSection.tsx

import { useEffect, useState } from "react";
import type { Me } from "@/entities/group";

import JiraIntegrationForm from "@/features/integrations/jira/ui/JiraIntegrationForm";

import { getJiraConnection } from "@/features/integrations/jira/api";

import { CheckCircle2, XCircle } from "lucide-react";

/* --- logos --- */
import jiraLogo from "@/public/logos/jira.png";

type Props = {
  me: Me | null;
  CardHeader: React.FC<{ title: string; subtitle?: string; compact?: boolean }>;
  Field: React.FC<{ label: string; children: React.ReactNode }>;
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  ButtonDangerOutline: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
};

export default function IntegrationsSection({
  me,
  CardHeader,
  Field,
  Input,
  ButtonPrimary,
  ButtonDangerOutline,
}: Props) {
  const [groupId, setGroupId] = useState<number | null>(null);

  const [connected, setConnected] = useState({
    jira: false,
  });

  // Get current group ID
  useEffect(() => {
    if (!me) return;
    if (me.currentGroupId) setGroupId(me.currentGroupId);
    else if (me.groups?.length) setGroupId(me.groups[0].id);
    else setGroupId(null);
  }, [me]);

  const tabs = [
    { key: "jira", label: "Jira", logo: jiraLogo },
  ] as const;

  /* ---------- Jira status ---------- */
  useEffect(() => {
    if (!groupId) return;

    let alive = true;

    (async () => {
      try {
        const conn = await getJiraConnection(groupId);
        if (!alive) return;
        setConnected((prev) => ({ ...prev, jira: !!conn }));
      } catch {
        if (!alive) return;
        setConnected((prev) => ({ ...prev, jira: false }));
      }
    })();

    return () => {
      alive = false;
    };
  }, [groupId]);





  /* ---------- callbacks from forms ---------- */

  function handleJiraStatusChange(isConnected: boolean) {
    setConnected((prev) => ({ ...prev, jira: isConnected }));
  }

  return (
    <div className="animate-fade-in">
      <CardHeader
        title="Integrations"
        subtitle="Connect external tools to speed up your workflow."
      />

      {/* group select */}
      {me?.groups && me.groups.length > 0 && (
        <div className="mb-5">
          <label className="text-xs text-slate-500 dark:text-slate-400">
            Group
          </label>
          <select
            className="w-full px-3 py-2 mt-1 text-sm bg-white border rounded-lg shadow-sm border-slate-300 text-slate-700 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-slate-800"
            value={groupId ?? ""}
            onChange={(e) => setGroupId(Number(e.target.value))}
          >
            {me.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Jira integration card */}
      <div className="mb-6">
        <div className="flex items-center gap-3 p-4 border rounded-2xl shadow-sm border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {/* Logo container */}
          <div
            className={`
              flex h-9 w-9 items-center justify-center rounded-xl
              bg-white shadow-sm dark:bg-slate-800
              ${
                connected.jira
                  ? "ring-2 ring-emerald-400/80"
                  : "ring-1 ring-slate-100/70 dark:ring-slate-700/80"
              }
            `}
          >
            <img
              src={jiraLogo}
              alt="Jira"
              className="object-contain w-6 h-6"
            />
          </div>

          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-50">
              Jira
            </span>

            <span
              className={`mt-0.5 inline-flex items-center gap-1 text-xs ${
                connected.jira
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {connected.jira ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  Not connected
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Jira integration form */}
      <div className="p-5 transition-all border shadow-sm rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        {!groupId && (
          <div className="text-slate-500">No groups available</div>
        )}

        {groupId && (
          <JiraIntegrationForm
            groupId={groupId}
            Field={Field}
            Input={Input}
            ButtonPrimary={ButtonPrimary}
            ButtonDangerOutline={ButtonDangerOutline}
            onStatusChange={handleJiraStatusChange}
          />
        )}
      </div>
    </div>
  );
}
