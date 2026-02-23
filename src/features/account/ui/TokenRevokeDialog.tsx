// src/features/account/component/tokens/TokenRevokeDialog.tsx
import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function TokenRevokeDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
      if ((e.key === "Enter" || e.key === " ") && !busy) {
        e.preventDefault();
        doConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, onCancel]);

  async function doConfirm() {
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to revoke token";
      setErr(msg);
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Revoke Token
            </h2>
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

        {/* Content */}
        <div className="text-sm text-slate-600 dark:text-slate-400">
          The token{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            “{name}”
          </span>{" "}
          will stop working immediately. This action cannot be undone.
        </div>

        {err && (
          <div className="px-3 py-2 mt-3 text-xs border rounded-md border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-300">
            {err}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={doConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-900/30 transition disabled:opacity-50"
          >
            {busy ? "Revoking…" : "Revoke"}
          </button>
        </div>

        <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
          You can always create a new token later.
        </p>
      </div>
    </div>
  );
}
