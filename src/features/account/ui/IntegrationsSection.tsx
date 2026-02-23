// src/features/account/component/integrations/IntegrationsSection.tsx

import { useEffect, useState } from "react";
import type { Me } from "@/entities/group";

import JiraIntegrationForm from "@/features/integrations/jira/ui/JiraIntegrationForm";
import SlackIntegrationForm from "@/features/integrations/slack/ui/SlackIntegrationForm";
import JenkinsIntegrationForm from "@/features/integrations/jenkins/ui/JenkinsIntegrationForm";
import TeamsIntegrationForm from "@/features/integrations/teams/ui/TeamsIntegrationForm";

import { getJiraConnection } from "@/features/integrations/jira/api";
import { getSlackConnection } from "@/features/integrations/slack/api";
import { getJenkinsConnection } from "@/features/integrations/jenkins/api";
import { getTeamsConnection } from "@/features/integrations/teams/api";

import { CheckCircle2, XCircle } from "lucide-react";

/* --- logos --- */
import jiraLogo from "@/public/logos/jira.png";
import slackLogo from "@/public/logos/slack.png";
import jenkinsLogo from "@/public/logos/jenkins.png";
import teamsLogo from "@/public/logos/teams.jpeg";

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
  const [tab, setTab] = useState<"jira" | "slack" | "jenkins" | "teams">(
    "jira"
  );
  const [groupId, setGroupId] = useState<number | null>(null);

  const [connected, setConnected] = useState({
    jira: false,
    slack: false,
    jenkins: false,
    teams: false,
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
    { key: "slack", label: "Slack", logo: slackLogo },
    { key: "teams", label: "Teams", logo: teamsLogo },
    { key: "jenkins", label: "Jenkins", logo: jenkinsLogo },
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

  /* ---------- Slack status ---------- */
  useEffect(() => {
    if (!groupId) return;

    let alive = true;

    (async () => {
      try {
        const conn = await getSlackConnection(groupId);
        if (!alive) return;
        setConnected((prev) => ({ ...prev, slack: !!conn && conn.active }));
      } catch {
        if (!alive) return;
        setConnected((prev) => ({ ...prev, slack: false }));
      }
    })();

    return () => {
      alive = false;
    };
  }, [groupId]);

  /* ---------- Jenkins status ---------- */
  useEffect(() => {
    if (!groupId) return;

    let alive = true;

    (async () => {
      try {
        const conn = await getJenkinsConnection(groupId);
        if (!alive) return;
        setConnected((prev) => ({
          ...prev,
          jenkins: !!conn?.active,
        }));
      } catch {
        if (!alive) return;
        setConnected((prev) => ({ ...prev, jenkins: false }));
      }
    })();

    return () => {
      alive = false;
    };
  }, [groupId]);

  /* ---------- Teams status ---------- */
  useEffect(() => {
    if (!groupId) return;

    let alive = true;

    (async () => {
      try {
        const conn = await getTeamsConnection(groupId);
        if (!alive) return;
        setConnected((prev) => ({
          ...prev,
          teams: !!conn && (conn.active ?? !!conn.webhookUrl),
        }));
      } catch {
        if (!alive) return;
        setConnected((prev) => ({ ...prev, teams: false }));
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

  function handleSlackStatusChange(isConnected: boolean) {
    setConnected((prev) => ({ ...prev, slack: isConnected }));
  }

  function handleJenkinsStatusChange(isConnected: boolean) {
    setConnected((prev) => ({ ...prev, jenkins: isConnected }));
  }

  function handleTeamsStatusChange(isConnected: boolean) {
    setConnected((prev) => ({ ...prev, teams: isConnected }));
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

      {/* tabs */}
      <div
        className="grid grid-cols-1 gap-4 mb-6  sm:grid-cols-2 lg:grid-cols-4"
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          const isConnected = connected[t.key as keyof typeof connected];

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`
                group relative flex items-center gap-3 rounded-2xl border px-4 py-3 
                text-sm font-medium transition-all duration-200
                shadow-sm w-full
                hover:-translate-y-0.5 hover:shadow-md hover:border-sky-300/70
                dark:hover:border-slate-500
                ${
                  active
                    ? "border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-slate-800"
                    : "border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/80"
                }
              `}
            >
              {/* Logo container with fixed size */}
              <div
                className={`
                  flex h-9 w-9 items-center justify-center rounded-xl 
                  bg-white shadow-sm dark:bg-slate-800
                  ${
                    isConnected
                      ? "ring-2 ring-emerald-400/80"
                      : "ring-1 ring-slate-100/70 dark:ring-slate-700/80"
                  }
                `}
              >
                <img
                  src={t.logo}
                  alt={t.label}
                  className="object-contain w-6 h-6"
                />
              </div>

              <div className="flex flex-col flex-1 text-left">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-50">
                  {t.label}
                </span>

                <span
                  className={`mt-0.5 inline-flex items-center gap-1 text-xs ${
                    isConnected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {isConnected ? (
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
            </button>
          );
        })}
      </div>

      {/* tab content */}
      <div className="p-5 transition-all border shadow-sm rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        {!groupId && (
          <div className="text-slate-500">No groups available</div>
        )}

        {groupId && tab === "jira" && (
          <JiraIntegrationForm
            groupId={groupId}
            Field={Field}
            Input={Input}
            ButtonPrimary={ButtonPrimary}
            ButtonDangerOutline={ButtonDangerOutline}
            onStatusChange={handleJiraStatusChange}
          />
        )}

        {groupId && tab === "slack" && (
          <SlackIntegrationForm
            groupId={groupId}
            Field={Field}
            Input={Input}
            ButtonPrimary={ButtonPrimary}
            ButtonDangerOutline={ButtonDangerOutline}
            onStatusChange={handleSlackStatusChange}
          />
        )}

        {groupId && tab === "teams" && (
          <TeamsIntegrationForm
            groupId={groupId}
            Field={Field}
            Input={Input}
            ButtonPrimary={ButtonPrimary}
            ButtonDangerOutline={ButtonDangerOutline}
            onStatusChange={handleTeamsStatusChange}
          />
        )}

        {groupId && tab === "jenkins" && (
          <JenkinsIntegrationForm
            groupId={groupId}
            Field={Field}
            Input={Input}
            ButtonPrimary={ButtonPrimary}
            ButtonDangerOutline={ButtonDangerOutline}
            onStatusChange={handleJenkinsStatusChange}
          />
        )}
      </div>
    </div>
  );
}
