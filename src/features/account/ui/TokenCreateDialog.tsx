// src/features/account/component/tokens/TokenCreateDialog.tsx
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function TokenCreateDialog({
  defaultName,
  onCancel,
  onCreate,
}: {
  defaultName?: string;
  onCancel: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(defaultName || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("Name is required");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await onCreate(trimmed);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to create token";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0f1524] transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Create API Token
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choose a name to help you recognize this token later.
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={busy}
            title="Close"
            className="p-1 border border-transparent rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Token name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CI script, Local dev"
            disabled={busy}
            className="w-full px-3 py-2 text-sm transition-all bg-white border rounded-lg border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700"
          />

          {err && (
            <div className="px-3 py-2 mt-2 text-xs border rounded-md border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-300">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create"}
            </button>
          </div>

          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
            You’ll get the token only once after creation. Copy and store it
            securely.
          </p>
        </form>
      </div>
    </div>
  );
}
