import { useState } from "react";
import type { Milestone, MilestoneCreate } from "@/entities/milestone";
import { createMilestone } from "@/entities/milestone";
import { PrimaryButton } from "@/shared/ui/buttons";
import DatePicker from "@/shared/ui/datepicker/DatePicker";

interface Props {
  projectId: number;
  onCreated: (created: Milestone) => void;
  onClose: () => void;
  onError?: (msg: string) => void;
}

export default function MilestoneCreateForm({ projectId, onCreated, onClose, onError }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startISO, setStartISO] = useState<string | null>(null);
  const [dueISO, setDueISO] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = name.trim().length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate || saving) return;
    setSaving(true);
    try {
      const payload: MilestoneCreate = {
        name: name.trim(),
        description: description.trim() || null,
        startDate: startISO,
        dueDate: dueISO,
      };
      const created = await createMilestone(projectId, payload);
      onCreated(created);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to create milestone";
      onError?.(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create milestone" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-3">
        {/* Name */}
        <div>
          <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white border outline-none rounded-xl border-slate-300 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
            placeholder="Q4 Release"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimum 3 characters.</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">Start date</label>
            <DatePicker valueISO={startISO} onChangeISO={setStartISO} placeholder="Pick start…" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">Due date</label>
            <DatePicker valueISO={dueISO} onChangeISO={setDueISO} placeholder="Pick due…" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white border outline-none rounded-xl border-slate-300 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
            placeholder="Optional description..."
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white border rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={!canCreate || saving}>
            {saving ? "Creating…" : "Create"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

/* Local Modal */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode; }) {
  return (
    <div className="fixed inset-0 z-50 grid p-4 place-items-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#0f1524]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
