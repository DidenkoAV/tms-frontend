// src/features/slack/components/SlackIntegrationForm.tsx

import { useEffect, useState } from "react";
import {
  getSlackConnection,
  saveSlackConnection,
  removeSlackConnection,
  testSlackConnection,
} from "@/features/integrations/slack/api";
import type { SlackConnectionDto } from "@/features/integrations/slack/types";

type Msg = { type: "ok" | "err"; text: string } | null;

interface Props {
  groupId: number;
  Field: React.FC<{ label: string; children: React.ReactNode }>;
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  ButtonDangerOutline: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  onStatusChange?: (connected: boolean) => void;
}

export default function SlackIntegrationForm({
  groupId,
  Field,
  Input,
  ButtonPrimary,
  ButtonDangerOutline,
  onStatusChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg>(null);

  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [botToken, setBotToken] = useState("");
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [defaultChannel, setDefaultChannel] = useState("");

  // notifications
  const [notifyRunStatusChange, setNotifyRunStatusChange] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setMsg(null);

      try {
        const conn = await getSlackConnection(groupId);

        if (!alive) return;

        if (conn) {
          const c = conn as SlackConnectionDto;
          setWorkspaceUrl(c.workspaceUrl || "");
          setDefaultChannel(c.defaultChannel || "");
          setHasSavedToken(!!c.botTokenMasked);
          setNotifyRunStatusChange(
            c.notifyRunStatusChange ?? c.notifications?.runStatusChange ?? false
          );

          onStatusChange?.(c.active ?? true);
        } else {
          setWorkspaceUrl("");
          setDefaultChannel("");
          setHasSavedToken(false);
          setNotifyRunStatusChange(false);
          onStatusChange?.(false);
        }
      } catch (e) {
        if (alive) {
          setWorkspaceUrl("");
          setDefaultChannel("");
          setHasSavedToken(false);
          setNotifyRunStatusChange(false);
          onStatusChange?.(false);
          setMsg({
            type: "err",
            text: "Failed to load Slack connection",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  function clearMsgSoon() {
    setTimeout(() => setMsg(null), 3000);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveSlackConnection(groupId, {
        workspaceUrl,
        botToken: botToken || undefined,
        defaultChannel,
        notifyRunStatusChange,
      });

      if (botToken) {
        setHasSavedToken(true);
        setBotToken("");
      }

      setMsg({
        type: "ok",
        text: "Slack connection saved.",
      });

      onStatusChange?.(true);
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || "Failed to save Slack connection",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onTest() {
    try {
      const message = await testSlackConnection(groupId);
      setMsg({ type: "ok", text: message });
      onStatusChange?.(true);
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || "Slack connection test failed",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onRemove() {
    if (!window.confirm("Remove Slack connection?")) return;

    try {
      await removeSlackConnection(groupId);
      setWorkspaceUrl("");
      setDefaultChannel("");
      setBotToken("");
      setHasSavedToken(false);
      setNotifyRunStatusChange(false);
      setMsg({ type: "ok", text: "Slack connection removed." });
      onStatusChange?.(false);
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || "Failed to remove Slack connection",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-3">
      {msg && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            msg.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading Slack settings…</div>
      ) : (
        <>
          <Field label="Slack workspace URL">
            <Input
              value={workspaceUrl}
              onChange={(e) => setWorkspaceUrl(e.target.value)}
              placeholder="https://your-workspace.slack.com"
            />
          </Field>

          <Field label={`Bot token ${hasSavedToken ? "(stored)" : ""}`}>
            <Input
              type="password"
              value={hasSavedToken && !botToken ? "************" : botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxx"
            />
          </Field>

          <Field label="Default channel">
            <Input
              value={defaultChannel}
              onChange={(e) => setDefaultChannel(e.target.value)}
              placeholder="#qa-team"
            />
          </Field>

          {/* Notifications */}
          <div className="pt-2 mt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="mb-2 text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Notifications
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="rounded shadow-sm border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                checked={notifyRunStatusChange}
                onChange={(e) => setNotifyRunStatusChange(e.target.checked)}
              />
              <span>
                Send Slack notifications when a run is{" "}
                <span className="font-semibold">opened / closed</span>.
              </span>
            </label>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Save
            </button>

            {hasSavedToken && (
              <>
                <button
                  type="button"
                  onClick={onTest}
                  className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Test
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </>
      )}
    </form>
  );
}
