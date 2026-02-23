import { useState } from "react";
import { PlusIcon, TrashIcon, SaveIcon, EditIcon } from "lucide-react";

interface MappingField {
  id: number;
  name: string;
  value: string;
}

interface Props {
  fields: MappingField[];
  onChange: (next: MappingField[]) => void;
  onSave?: () => void;
  saving?: boolean;
  defaultEditing?: boolean;
}

export default function AutotestMappingBlock({
  fields,
  onChange,
  onSave,
  saving,
  defaultEditing = false,
}: Props) {
  const [editing, setEditing] = useState(defaultEditing);

  const addField = () => {
    const next = [...fields, { id: Date.now(), name: "", value: "" }];
    onChange(next);
  };

  const updateField = (id: number, key: keyof MappingField, val: string) => {
    const next = fields.map((f) => (f.id === id ? { ...f, [key]: val } : f));
    onChange(next);
  };

  const removeField = (id: number) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1524]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">
          Autotest Meta
        </h3>

        {!defaultEditing &&
          (editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSave?.();
                  setEditing(false);
                }}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <SaveIcon className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <EditIcon className="w-4 h-4" /> Edit
            </button>
          ))}
      </div>

      {/* Empty message */}
      {fields.length === 0 && !editing && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No mapping fields.
        </p>
      )}

      {/* Fields */}
      {(fields.length > 0 || editing) && (
        <div className="space-y-2">
          {fields.map((f) => (
            <div
              key={f.id}
              className={`group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800`}
            >
              {editing ? (
                <>
                  <input
                    className="flex-1 min-w-[100px] rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-cyan-400"
                    placeholder="Field name"
                    value={f.name}
                    onChange={(e) => updateField(f.id, "name", e.target.value)}
                  />
                  <input
                    className="flex-[2] rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-cyan-400"
                    placeholder="Value"
                    value={f.value}
                    onChange={(e) => updateField(f.id, "value", e.target.value)}
                  />
                  <button
                    onClick={() => removeField(f.id)}
                    className="p-1 ml-2 border border-transparent rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <TrashIcon className="w-4 h-4 text-rose-500" />
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200"
                    title={f.name}
                  >
                    {f.name || <span className="text-slate-400">Unnamed</span>}
                  </div>
                  <div
                    className="flex-[2] truncate text-sm text-slate-600 dark:text-slate-300"
                    title={f.value}
                  >
                    {f.value || "—"}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add field (smaller, minimalist) */}
      {editing && (
        <button
          onClick={addField}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 transition"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Add field
        </button>
      )}
    </div>
  );
}
