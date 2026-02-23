// src/features/projects/components/ProjectCreateForm.tsx
import { PrimaryButton } from "@/shared/ui/buttons";
import { AlertBanner } from "@/shared/ui/alert";

export function ProjectCreateForm({
  form,
  setForm,
  groups,
  onCreate,
  onCancel,
  creating,
  disabled,
  error,
}: {
  form: any;
  setForm: (v: any) => void;
  groups: Array<{ id: number; name: string; personal: boolean }>;
  onCreate: (e: React.FormEvent) => void;
  onCancel: () => void;
  creating: boolean;
  disabled: boolean;
  error?: string | null;
}) {
  return (
    <form
      onSubmit={onCreate}
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1524]"
    >
      <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">
        Create project
      </h2>

      {error && <AlertBanner kind="error" className="mb-3">{error}</AlertBanner>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">Group</label>
          <select
            className="w-full px-3 py-2 text-sm bg-white border outline-none rounded-xl border-slate-300 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900"
            value={form.groupId ?? ""}
            onChange={(e) => setForm({ ...form, groupId: e.target.value ? Number(e.target.value) : null })}
            required
          >
            <option value="" disabled>Select a group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}{g.personal ? " (personal)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">Name</label>
          <input
            className="w-full px-3 py-2 text-sm bg-white border outline-none rounded-xl border-slate-300 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900"
            placeholder="My Project"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Code will be generated automatically.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">Description (optional)</label>
          <input
            className="w-full px-3 py-2 text-sm bg-white border outline-none rounded-xl border-slate-300 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Short description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <PrimaryButton type="submit" disabled={creating || disabled}>
          {creating ? "Creating…" : "Create"}
        </PrimaryButton>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-white border rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
