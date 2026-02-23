// src/features/account/component/tokens/TokensSection.tsx
import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import type { TokenItem } from "@/entities/group";
import TokenRevealDialog from "./TokenRevealDialog";
import TokenCreateDialog from "./TokenCreateDialog";
import TokenRevokeDialog from "./TokenRevokeDialog";
import { Calendar, Clock, KeyRound } from "lucide-react";

type TokensSectionProps = {
  CardHeader: (props: { title: string; subtitle?: string; compact?: boolean }) => React.ReactElement;
  ButtonPrimary: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactElement;
  ButtonDangerOutline: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.ReactElement;
};

export default function TokensSection({
  CardHeader,
  ButtonPrimary,
  ButtonDangerOutline,
}: TokensSectionProps) {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealToken, setRevealToken] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toRevoke, setToRevoke] = useState<{ id: string; name: string } | null>(null);

  async function loadTokens() {
    setLoading(true);
    try {
      const r = await http.get("/api/auth/tokens");
      setTokens(r.data || []);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTokens();
  }, []);

  async function createToken(name: string) {
    const r = await http.post("/api/auth/tokens", { name: name.trim() });
    const created: TokenItem = r.data;
    setTokens((prev) => [{ ...created, tokenOnce: undefined }, ...prev]);
    if (created.tokenOnce) setRevealToken(created.tokenOnce);
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <CardHeader
          title="API Tokens"
          subtitle="Create and manage personal access tokens for integrations and automation."
          compact
        />
        <div className="flex items-center gap-2">
          <button
            onClick={loadTokens}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            Generate
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-3 text-slate-500 dark:text-slate-400">Loading tokens…</div>
      )}

      {!loading && !tokens.length && (
        <div className="p-4 mt-3 text-sm text-center border rounded-xl border-slate-200 bg-slate-50/80 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
          No tokens yet — generate one to start using the API.
        </div>
      )}

      <ul className="mt-3 space-y-3">
        {tokens.map((t) => {
          const createdAt = formatDate(t.createdAt ?? undefined);
          const lastUsedAt = formatDate(t.lastUsedAt ?? undefined);
          return (
            <li
              key={t.id}
              className="p-4 transition-all duration-300 bg-white border group rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/40 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                    <KeyRound className="w-4 h-4 opacity-70" />
                    <span className="truncate">{t.name}</span>
                  </div>

                  <div className="flex flex-wrap items-center mt-1 text-xs gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
                    {createdAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span>Created {createdAt}</span>
                      </div>
                    )}
                    {lastUsedAt && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        <span>Last used {lastUsedAt}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <ButtonDangerOutline
                    onClick={() => setToRevoke({ id: t.id, name: t.name })}
                    className="!px-3 !py-1.5 !text-sm !rounded-lg !border-rose-300 hover:!border-rose-400 hover:!bg-rose-50 dark:!border-rose-800 dark:hover:!bg-rose-900/20"
                  >
                    Revoke
                  </ButtonDangerOutline>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {showCreate && (
        <TokenCreateDialog
          defaultName={`Token ${tokens.length + 1}`}
          onCancel={() => setShowCreate(false)}
          onCreate={async (name) => {
            await createToken(name);
            setShowCreate(false);
          }}
        />
      )}

      {revealToken != null && (
        <TokenRevealDialog token={revealToken} onClose={() => setRevealToken(null)} />
      )}

      {toRevoke && (
        <TokenRevokeDialog
          name={toRevoke.name}
          onCancel={() => setToRevoke(null)}
          onConfirm={async () => {
            await http.delete(`/api/auth/tokens/${toRevoke.id}`);
            setTokens((p) => p.filter((t) => t.id !== toRevoke.id));
            setToRevoke(null);
          }}
        />
      )}
    </>
  );
}
