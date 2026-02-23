import { useState } from "react";
import { PrimaryButton } from "@/shared/ui/buttons";

interface RunCreateFormProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  creating: boolean;
}

export default function RunCreateForm({
  onClose,
  onCreate,
  creating,
}: RunCreateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const canCreate = name.trim().length >= 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    onCreate(name, description);
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
          <h3 className="text-lg font-semibold">Create run</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">
              Name
            </label>
            <input
              className="w-full px-3 py-2 bg-white border outline-none rounded-xl border-slate-300 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
              placeholder="Regression #42"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">
              Description (optional)
            </label>
            <input
              className="w-full px-3 py-2 bg-white border outline-none rounded-xl border-slate-300 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
              placeholder="Nightly regression run"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-white border rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" disabled={!canCreate || creating}>
              {creating ? "Creating…" : "Create"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
