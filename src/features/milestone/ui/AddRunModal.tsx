import { useState, useMemo } from "react";
import { TFCheckbox } from "@/shared/ui/table";
import { PrimaryButton } from "@/shared/ui/buttons";
import { PlusIcon } from "@/shared/ui/icons";
import SearchInput from "@/shared/ui/search/SearchInput";
import type { Run } from "@/entities/test-run";

/* Common button style */
const controlPill =
  "inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm leading-none " +
  "border-slate-300 text-slate-800 bg-white/80 hover:bg-white hover:shadow-sm hover:-translate-y-0.5 transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 " +
  "dark:border-slate-700 dark:text-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:focus-visible:ring-violet-400/30";

export default function AddRunModal({
  onClose,
  runs,
  picked,
  setPicked,
  onAdd,
}: {
  onClose: () => void;
  runs: Run[];
  picked: number[];
  setPicked: React.Dispatch<React.SetStateAction<number[]>>;
  onAdd: () => void;
}) {
  const [q, setQ] = useState("");

  /* Search filter */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return runs;
    return runs.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(s) ||
        (r.description || "").toLowerCase().includes(s)
    );
  }, [runs, q]);

  /* Checkbox selection */
  function toggle(id: number, checked: boolean) {
    setPicked((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  return (
    <div
      className="fixed inset-0 z-50 grid p-4 place-items-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#0f1524]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add runs to milestone</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="mb-3">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search runs…"
            ariaLabel="Search runs"
          />
        </div>

        {/* Table */}
        <div className="overflow-auto border rounded max-h-80 border-slate-200 dark:border-slate-800">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
              No available runs.
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {filtered.map((r) => {
                  const checked = picked.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200/70 dark:border-slate-800/70"
                    >
                      <td className="w-8 px-3 py-2 align-middle">
                        <TFCheckbox
                          checked={checked}
                          onChange={(v) => toggle(r.id, v)}
                          title={checked ? "Unselect run" : "Select run"}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-slate-900 dark:text-slate-100">
                          {r.name}
                        </div>
                        {r.description && (
                          <div className="text-slate-500 dark:text-slate-400">
                            {r.description}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 mt-3">
          <button className={controlPill} onClick={onClose} type="button">
            Cancel
          </button>
          <PrimaryButton disabled={picked.length === 0} onClick={onAdd}>
            <PlusIcon /> Add {picked.length || ""} run(s)
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
