// src/features/teams/components/TeamsIntegrationForm.tsx

import { useEffect, useState } from "react";
import {
  getTeamsConnection,
  saveTeamsConnection,
  removeTeamsConnection,
  testTeamsConnection,
} from "@/features/integrations/teams/api";
import type {
  TeamsConnectionDto,
  TeamsConnectionRequest,
} from "@/features/integrations/teams/types";

type Msg = { type: "ok" | "err"; text: string } | null;

interface Props {
  groupId: number;
  Field: React.FC<{ label: string; children: React.ReactNode }>;
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  ButtonDangerOutline: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement>
  >;
  onStatusChange?: (connected: boolean) => void;
}

export default function TeamsIntegrationForm({
  groupId,
  Field,
  Input,
  ButtonPrimary,
  ButtonDangerOutline,
  onStatusChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg>(null);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasConnection, setHasConnection] = useState(false);

  // notifications
  const [notifyRunStatusChange, setNotifyRunStatusChange] = useState(false);

  // NEW: per-option Jenkins run notifications
  const [notifyRunTriggerAll, setNotifyRunTriggerAll] = useState(false);
  const [notifyRunTriggerAutomated, setNotifyRunTriggerAutomated] =
    useState(false);
  const [notifyRunTriggerSelected, setNotifyRunTriggerSelected] =
    useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setMsg(null);

      try {
        const conn = await getTeamsConnection(groupId);

        if (!alive) return;

        if (conn) {
          const c = conn as TeamsConnectionDto;

          setWebhookUrl(c.webhookUrl || "");
          setApiKey((c.apiKey ?? "") || "");
          setNotifyRunStatusChange(c.notifyRunStatusChange ?? false);

          // NEW: load flags from backend dto (will add to type/model later)
          setNotifyRunTriggerAll(c.notifyRunTriggerAll ?? false);
          setNotifyRunTriggerAutomated(
            c.notifyRunTriggerAutomated ?? false
          );
          setNotifyRunTriggerSelected(
            c.notifyRunTriggerSelected ?? false
          );

          const connected =
            c.active ?? (!!c.webhookUrl && !!c.apiKey);
          setHasConnection(connected);
          onStatusChange?.(connected);
        } else {
          setWebhookUrl("");
          setApiKey("");
          setNotifyRunStatusChange(false);
          setNotifyRunTriggerAll(false);
          setNotifyRunTriggerAutomated(false);
          setNotifyRunTriggerSelected(false);
          setHasConnection(false);
          onStatusChange?.(false);
        }
      } catch (e) {
        if (alive) {
          setWebhookUrl("");
          setApiKey("");
          setNotifyRunStatusChange(false);
          setNotifyRunTriggerAll(false);
          setNotifyRunTriggerAutomated(false);
          setNotifyRunTriggerSelected(false);
          setHasConnection(false);
          onStatusChange?.(false);
          setMsg({
            type: "err",
            text: "Failed to load Teams connection",
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

  function buildRequest(): TeamsConnectionRequest {
    return {
      webhookUrl,
      apiKey: apiKey || undefined,
      notifyRunStatusChange,

      // NEW: send flags to backend
      notifyRunTriggerAll,
      notifyRunTriggerAutomated,
      notifyRunTriggerSelected,
    };
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();

    if (!webhookUrl) {
      setMsg({
        type: "err",
        text: "Teams webhook URL is required.",
      });
      clearMsgSoon();
      return;
    }

    try {
      await saveTeamsConnection(groupId, buildRequest());

      setHasConnection(!!webhookUrl && !!apiKey);

      setMsg({
        type: "ok",
        text: "Teams connection saved.",
      });

      onStatusChange?.(true);
    } catch (e: any) {
      setMsg({
        type: "err",
        text:
          e?.response?.data?.message ||
          "Failed to save Teams connection",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onTest() {
    if (!webhookUrl || !apiKey) {
      setMsg({
        type: "err",
        text: "Both webhook URL and Flow API key are required to test the connection.",
      });
      clearMsgSoon();
      onStatusChange?.(false);
      return;
    }

    try {
      // Save current settings first, so backend has correct URL + token
      await saveTeamsConnection(groupId, buildRequest());

      const message = await testTeamsConnection(groupId);
      setMsg({ type: "ok", text: message });
      onStatusChange?.(true);
    } catch (e: any) {
      setMsg({
        type: "err",
        text:
          e?.response?.data?.message ||
          "Teams connection test failed",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onRemove() {
    if (!window.confirm("Remove Teams connection?")) return;

    try {
      await removeTeamsConnection(groupId);
      setWebhookUrl("");
      setApiKey("");
      setNotifyRunStatusChange(false);
      setNotifyRunTriggerAll(false);
      setNotifyRunTriggerAutomated(false);
      setNotifyRunTriggerSelected(false);
      setHasConnection(false);
      setMsg({ type: "ok", text: "Teams connection removed." });
      onStatusChange?.(false);
    } catch (e: any) {
      setMsg({
        type: "err",
        text:
          e?.response?.data?.message ||
          "Failed to remove Teams connection",
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
        <div className="text-sm text-slate-500">
          Loading Teams settings…
        </div>
      ) : (
        <>
          <Field label="Teams webhook URL">
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://default....powerautomate.com/.../invoke?api-version=1..."
            />
          </Field>

          <Field label="Flow API key (x-api-key)">
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="TF-TEAMS-SECRET-2398FJASD923"
            />
            <p className="mt-1 text-xs text-slate-500">
              This value will be sent as the <code>x-api-key</code> header to
              your Power Automate flow.
            </p>
          </Field>

          {/* Notifications */}
          <div className="pt-2 mt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="mb-2 text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Notifications
            </div>

            {/* Run status change */}
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="rounded shadow-sm border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                checked={notifyRunStatusChange}
                onChange={(e) =>
                  setNotifyRunStatusChange(e.target.checked)
                }
              />
              <span>
                Send Teams notifications when a run is{" "}
                <span className="font-semibold">opened / closed</span>.
              </span>
            </label>

            {/* NEW: Jenkins run trigger options */}
            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Jenkins run triggers
              </div>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded shadow-sm border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                  checked={notifyRunTriggerAll}
                  onChange={(e) =>
                    setNotifyRunTriggerAll(e.target.checked)
                  }
                />
                <span>
                  Notify when{" "}
                  <span className="font-semibold">Run entire run</span> is
                  triggered from Jenkins menu.
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded shadow-sm border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                  checked={notifyRunTriggerAutomated}
                  onChange={(e) =>
                    setNotifyRunTriggerAutomated(e.target.checked)
                  }
                />
                <span>
                  Notify when{" "}
                  <span className="font-semibold">Run automated tests</span> is
                  triggered.
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded shadow-sm border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900"
                  checked={notifyRunTriggerSelected}
                  onChange={(e) =>
                    setNotifyRunTriggerSelected(e.target.checked)
                  }
                />
                <span>
                  Notify when{" "}
                  <span className="font-semibold">Run selected tests</span> is
                  triggered.
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <ButtonPrimary type="submit">Save</ButtonPrimary>

            {hasConnection && (
              <>
                <ButtonPrimary type="button" onClick={onTest}>
                  Test
                </ButtonPrimary>
                <ButtonDangerOutline type="button" onClick={onRemove}>
                  Remove
                </ButtonDangerOutline>
              </>
            )}
          </div>
        </>
      )}
    </form>
  );
}
