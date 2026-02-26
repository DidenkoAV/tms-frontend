// src/features/suites/components/CreateSuiteModal.tsx
import { useState } from "react";
import { http } from "@/lib/http";
import { AlertBanner } from "@/shared/ui/alert";

type Props = {
  projectId: number;
  parentSuiteId?: number | null;
  availableSuites?: Suite[];
  onClose: () => void;
  onCreated: (suite: Suite) => void;
};

export type Suite = {
  id: number;
  projectId: number;
  parentId?: number | null;
  depth: number;
  name: string;
  description?: string | null;
  archived: boolean;
};

export default function CreateSuiteModal({ projectId, parentSuiteId, availableSuites = [], onClose, onCreated }: Props) {
  const [sf, setSf] = useState<{ name: string; description: string; parentId: number | "" }>({
    name: "",
    description: "",
    parentId: parentSuiteId ?? ""
  });
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busySuite, setBusySuite] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sf.name.trim().length < 3) return;

    setFormErr(null);
    setBusySuite(true);

    try {
      const payload: any = {
        name: sf.name.trim(),
        description: sf.description.trim() || undefined,
      };

      if (sf.parentId !== "") {
        payload.parentId = sf.parentId;
      }

      const { data } = await http.post<Suite>(`/api/projects/${projectId}/suites`, payload);
      onCreated(data);
      setSf({ name: "", description: "", parentId: "" });
      onClose();
    } catch (e: any) {
      setFormErr(e?.response?.data?.message || "Create suite failed");
    } finally {
      setBusySuite(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid p-4 place-items-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#0f1524]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Create suite
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {formErr && (
          <AlertBanner kind="error" className="mb-3">
            {formErr}
          </AlertBanner>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3">
          {!parentSuiteId && availableSuites.length > 0 && (
            <div>
              <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">
                Parent Suite (optional)
              </label>
              <select
                className="w-full px-3 py-2 text-sm bg-white border outline-none rounded-xl border-slate-300 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={sf.parentId}
                onChange={(e) => setSf((f) => ({ ...f, parentId: e.target.value === "" ? "" : Number(e.target.value) }))}
              >
                <option value="">-- Root level --</option>
                {availableSuites
                  .filter(s => s.depth < 4) // Max depth is 4 (0-4), so can only add children to depth 0-3
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {"  ".repeat(s.depth)}{s.name} (depth {s.depth})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">
              Name
            </label>
            <input
              className="w-full px-3 py-2 text-sm bg-white border outline-none rounded-xl border-slate-300 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Authentication"
              value={sf.name}
              onChange={(e) => setSf((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">
              Description (optional)
            </label>
            <input
              className="w-full px-3 py-2 text-sm bg-white border outline-none rounded-xl border-slate-300 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Login / MFA / Signup"
              value={sf.description}
              onChange={(e) => setSf((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 active:translate-y-px disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busySuite || sf.name.trim().length < 3}
              className={[
                "inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 active:translate-y-px dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
                busySuite || sf.name.trim().length < 3 ? "opacity-60 pointer-events-none" : "",
              ].join(" ")}
            >
              {busySuite ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
