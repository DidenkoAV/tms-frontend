import { useState, useMemo, useEffect } from "react";
import { TFCheckbox } from "@/shared/ui/table";
import { PrimaryButton } from "@/shared/ui/buttons";
import Modal from "@/shared/ui/modal/Modal";
import type { TestCase } from "@/entities/test-case";

type Props = {
  onClose: () => void;
  onAddCases: (ids: number[]) => void;
  suites: { id: number; name: string }[];
  allCases: TestCase[];
  alreadyInRun: Set<number>;
};

type Mode = "cases" | "suite";

export default function AddToRunModal({
  onClose,
  onAddCases,
  suites,
  allCases,
  alreadyInRun,
}: Props) {
  const [mode, setMode] = useState<Mode>("cases");
  const [suiteId, setSuiteId] = useState<number | "ALL">("ALL");
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const eligibleCases = useMemo(() => {
    let list = allCases.filter((c) => !alreadyInRun.has(c.id));
    if (suiteId !== "ALL") list = list.filter((c) => c.suiteId === suiteId);
    return list;
  }, [allCases, suiteId, alreadyInRun]);

  const eligibleSuites = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of allCases) {
      if (alreadyInRun.has(c.id)) continue;
      if (!c.suiteId) continue;
      map[c.suiteId] = (map[c.suiteId] || 0) + 1;
    }
    return suites
      .filter((s) => map[s.id] > 0)
      .map((s) => ({ ...s, left: (map as any)[s.id] as number }));
  }, [allCases, suites, alreadyInRun]);

  useEffect(() => {
    setPicked(new Set());
  }, [suiteId, mode]);

  function toggle(id: number) {
    setPicked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function addSuite() {
    if (typeof suiteId !== "number") return;
    const ids = allCases
      .filter((c) => c.suiteId === suiteId && !alreadyInRun.has(c.id))
      .map((c) => c.id);
    if (!ids.length) {
      onClose();
      return;
    }
    onAddCases(ids);
  }

  return (
    <Modal title="Add cases to run" onClose={onClose}>
      <div className="inline-flex p-1 mb-3 text-sm bg-white border rounded-2xl border-slate-300 dark:border-slate-700 dark:bg-slate-900">
        <button
          onClick={() => setMode("cases")}
          className={`rounded-xl px-3 py-1 ${
            mode === "cases"
              ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Cases
        </button>
        <button
          onClick={() => setMode("suite")}
          className={`rounded-xl px-3 py-1 ${
            mode === "suite"
              ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Suite
        </button>
      </div>

      <div className="mb-3">
        <label className="block mb-1 text-sm text-slate-600 dark:text-slate-400">
          Suite
        </label>
        <select
          value={suiteId === "ALL" ? "ALL" : String(suiteId)}
          onChange={(e) =>
            setSuiteId(
              e.target.value === "ALL" ? "ALL" : Number(e.target.value)
            )
          }
          className="w-full px-3 py-2 text-sm bg-white border outline-none rounded-2xl border-slate-300 focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-cyan-400"
        >
          <option value="ALL">All suites</option>
          {eligibleSuites.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.left ? `(${s.left})` : ""}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Suites already fully added are hidden.
        </p>
      </div>

      {mode === "cases" ? (
        <>
          <div className="overflow-auto border max-h-80 rounded-2xl border-slate-300 dark:border-slate-800">
            {eligibleCases.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
                Nothing to add.
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {eligibleCases.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-slate-200/70 dark:border-slate-800/60"
                    >
                      <td className="w-8 px-3 py-2">
                        <TFCheckbox
                          checked={picked.has(c.id)}
                          onChange={() => toggle(c.id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-slate-900 dark:text-slate-100">
                          {c.title}
                        </div>
                      </td>
                      <td className="w-40 px-3 py-2 text-right">
                        {c.suiteId ? (
                          <span className="rounded-2xl border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            Suite #{c.suiteId}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">No suite</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-white border rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Cancel
            </button>
            <PrimaryButton
              onClick={() => onAddCases(Array.from(picked))}
              disabled={picked.size === 0}
            >
              Add {picked.size || ""} case(s)
            </PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <div className="p-3 text-sm bg-white border rounded-2xl border-slate-300 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            Add <b>all</b> cases from the selected suite (excluding ones already
            in this run).
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-white border rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              Cancel
            </button>
            <PrimaryButton onClick={addSuite} disabled={suiteId === "ALL"}>
              Add suite
            </PrimaryButton>
          </div>
        </>
      )}
    </Modal>
  );
}
