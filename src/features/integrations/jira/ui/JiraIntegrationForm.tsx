// src/features/jira/components/JiraIntegrationForm.tsx

import { useEffect, useState } from "react";
import {
  getJiraConnection,
  saveJiraConnection,
  removeJiraConnection,
  testJiraConnection,
} from "@/features/integrations/jira/api";

type Msg = { type: "ok" | "err"; text: string } | null;

interface Props {
  groupId: number;
  Field: React.FC<{ label: string; children: React.ReactNode }>;
  Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  ButtonDangerOutline: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  onStatusChange?: (connected: boolean) => void;
}

export default function JiraIntegrationForm({
  groupId,
  Field,
  Input,
  ButtonPrimary,
  ButtonDangerOutline,
  onStatusChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg>(null);

  // form state
  const [baseUrl, setBaseUrl] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [defaultProject, setDefaultProject] = useState("");

  // Load settings only when groupId changes
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setMsg(null);

      try {
        const c = await getJiraConnection(groupId);
        if (!alive) return;

        if (c) {
          setBaseUrl(c.baseUrl || "");
          setEmail(c.email || "");
          setDefaultProject(c.defaultProject || "");
          setHasSavedToken(c.hasToken);

          // Saved integration exists → consider connected
          onStatusChange?.(true);
        } else {
          setBaseUrl("");
          setEmail("");
          setDefaultProject("");
          setHasSavedToken(false);
          onStatusChange?.(false);
        }
      } catch {
        if (alive) {
          setBaseUrl("");
          setEmail("");
          setDefaultProject("");
          setHasSavedToken(false);
          onStatusChange?.(false);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // Important: track only groupId, not onStatusChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  function clearMsgSoon() {
    setTimeout(() => setMsg(null), 3000);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveJiraConnection(groupId, {
        baseUrl,
        email,
        apiToken: token || undefined,
        defaultProject,
      });

      if (token) {
        setHasSavedToken(true);
        setToken("");
      }

      setMsg({
        type: "ok",
        text: "Jira connection saved.",
      });

      onStatusChange?.(true);
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || "Failed to save Jira connection",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onTest() {
    try {
      const message = await testJiraConnection(groupId);
      setMsg({ type: "ok", text: message });
      onStatusChange?.(true);
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || "Connection failed",
      });
      onStatusChange?.(false);
    } finally {
      clearMsgSoon();
    }
  }

  async function onRemove() {
    if (!window.confirm("Remove Jira connection?")) return;

    try {
      await removeJiraConnection(groupId);
      setBaseUrl("");
      setEmail("");
      setToken("");
      setDefaultProject("");
      setHasSavedToken(false);
      setMsg({ type: "ok", text: "Jira connection removed." });
      onStatusChange?.(false);
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || "Failed to remove connection",
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
              ? "border-emerald-300 bg-emerald-50"
              : "border-rose-300 bg-rose-50"
          }`}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div>Loading Jira settings…</div>
      ) : (
        <>
          <Field label="Site URL">
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-domain.atlassian.net"
            />
          </Field>

          <Field label="Service email">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jira-bot@company.com"
            />
          </Field>

          <Field label={`API token ${hasSavedToken ? "(stored)" : ""}`}>
            <Input
              type="password"
              value={hasSavedToken && !token ? "************" : token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste Jira API token"
            />
          </Field>

          <Field label="Default project key">
            <Input
              value={defaultProject}
              onChange={(e) => setDefaultProject(e.target.value)}
              placeholder="TES"
            />
          </Field>

          <div className="flex gap-2">
            <ButtonPrimary type="submit">Save</ButtonPrimary>

            {hasSavedToken && (
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
