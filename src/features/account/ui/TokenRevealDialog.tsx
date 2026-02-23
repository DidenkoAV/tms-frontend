// src/features/account/component/tokens/TokenRevealDialog.tsx
import { useEffect } from "react";
import { X, Copy } from "lucide-react";

export default function TokenRevealDialog({
  token,
  onClose,
}: {
  token: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function copy(text: string, okMsg = "Copied") {
    navigator.clipboard.writeText(text).then(
      () => alert(okMsg),
      () => alert("Copy failed")
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0f1524] transition-all animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Token created
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              It will be shown only once — copy and store it now.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-transparent rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Token Display */}
        <div className="p-3 border rounded-lg border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          <code className="block font-mono text-sm break-all select-all text-slate-800 dark:text-slate-100">
            {token}
          </code>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => copy(token, "Token copied")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            <Copy className="w-4 h-4 opacity-80" />
            Copy token
          </button>
          <button
            onClick={() =>
              copy(`Authorization: Bearer ${token}`, "Header copied")
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            <Copy className="w-4 h-4 opacity-80" />
            Copy header
          </button>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
