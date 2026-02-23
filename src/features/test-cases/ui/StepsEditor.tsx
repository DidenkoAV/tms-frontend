// src/features/cases/components/StepsEditor.tsx
import { useEffect, useState, type DragEvent } from "react";
import { TFCheckbox } from "@/shared/ui/table/CustomCheckbox";
import { InfoIcon } from "lucide-react";

export type StepForm = { action: string; expected: string };

type Props = {
  steps: StepForm[];
  onChange: (next: StepForm[]) => void;
  expectedEnabledDefault?: boolean;
};

/* ------------ parsing helpers ------------ */
const IN_STEP_SPLIT = /\s*(?:->|=>|→|\|\|)\s*/;

function splitSteps(raw: string): string[] {
  const PH = "<<<SC>>>";
  const s = (raw ?? "").replace(/\r\n?/g, "\n").replace(/\\;/g, PH);
  return s
    .split(/[\n;]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replaceAll(PH, ";"));
}
function parseLine(line: string): StepForm {
  const t = (line ?? "").trim();
  if (!t) return { action: "", expected: "" };
  const i = t.search(IN_STEP_SPLIT);
  if (i === -1) return { action: t, expected: "" };
  const m = t.slice(i).match(IN_STEP_SPLIT);
  if (!m) return { action: t, expected: "" };
  const left = t.slice(0, i).trim();
  const right = t.slice(i + m[0].length).trim();
  return { action: left, expected: right };
}
const joinActions = (arr: StepForm[]) =>
  arr.map((s) => (s.action || "").trim()).filter(Boolean).join("\n");

/* ------------ Step Item ------------ */
function StepItem({
  index,
  value,
  expectedOn,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  index: number;
  value: StepForm;
  expectedOn: boolean;
  onChange: (next: StepForm) => void;
  onDelete: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="p-3 transition rounded-md hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Step {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-sm select-none cursor-grab text-slate-400"
            title="Drag"
          >
            ⋮⋮
          </span>
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
            title="Delete step"
          >
            ×
          </button>
        </div>
      </div>

      <div className={`grid gap-2 ${expectedOn ? "md:grid-cols-2" : ""}`}>
        <textarea
          placeholder="Action..."
          value={value.action}
          onChange={(e) => onChange({ ...value, action: e.target.value })}
          className="w-full px-3 py-2 text-sm transition bg-transparent border rounded-md outline-none resize-y border-slate-200 text-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 dark:border-slate-700 dark:text-slate-200 dark:focus:border-cyan-400 dark:focus:ring-1 dark:focus:ring-cyan-900/40"
        />
        {expectedOn && (
          <textarea
            placeholder="Expected result..."
            value={value.expected}
            onChange={(e) => onChange({ ...value, expected: e.target.value })}
            className="w-full px-3 py-2 text-sm transition bg-transparent border rounded-md outline-none resize-y border-slate-200 text-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 dark:border-slate-700 dark:text-slate-200 dark:focus:border-cyan-400 dark:focus:ring-1 dark:focus:ring-cyan-900/40"
          />
        )}
      </div>
    </div>
  );
}

/* ------------ StepsEditor ------------ */
const MODE_KEY = "steps.editor.mode.v1";
type Mode = "structured" | "simple";

export default function StepsEditor({
  steps,
  onChange,
  expectedEnabledDefault = true,
}: Props) {
  const stepCount = steps.length;
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem(MODE_KEY) as Mode) || "structured"
  );
  useEffect(() => localStorage.setItem(MODE_KEY, mode), [mode]);

  const [expectedOn, setExpectedOn] = useState(expectedEnabledDefault);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [simpleRaw, setSimpleRaw] = useState(() => joinActions(steps));

  const addEmpty = () => onChange([...steps, { action: "", expected: "" }]);
  const clearAll = () => onChange([]);

  const bulkAdd = (raw: string) => {
    const chunks = splitSteps(raw);
    const parsed = chunks
      .map(parseLine)
      .map((s) => (expectedOn ? s : { ...s, expected: "" }));
    onChange([...steps, ...parsed]);
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    if (m === "simple") {
      const onlyActions = steps.map((s) => ({ action: s.action, expected: "" }));
      onChange(onlyActions);
      setSimpleRaw(joinActions(onlyActions));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1524]">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Steps
            <span className="ml-2 text-xs font-normal text-slate-500">
              {stepCount} item{stepCount === 1 ? "" : "s"}
            </span>
          </span>

          {/* Tooltip */}
          <div className="relative group">
            <InfoIcon
              size={16}
              className="text-slate-400 dark:text-slate-500 cursor-help"
            />
            <div className="absolute z-10 hidden max-w-sm p-2 text-xs bg-white border rounded-md shadow-sm left-5 top-1 group-hover:block w-max border-slate-200 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Use “→”, “⇒”, or “||” for expected result; separate steps by “;” or new lines.
            </div>
          </div>

          <div className="inline-flex p-1 ml-3 text-sm border rounded-full border-slate-300/70 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/50">
            <button
              onClick={() => switchMode("structured")}
              className={`px-3 py-1 rounded-full transition-colors ${
                mode === "structured"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-800/70"
              }`}
            >
              Structured
            </button>
            <button
              onClick={() => switchMode("simple")}
              className={`px-3 py-1 rounded-full transition-colors ${
                mode === "simple"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-800/70"
              }`}
            >
              Simple
            </button>
          </div>
        </div>

        {mode === "structured" && (
          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <TFCheckbox
              size={16}
              checked={expectedOn}
              onChange={(checked) => {
                setExpectedOn(checked);
                if (!checked)
                  onChange(steps.map((s) => ({ ...s, expected: "" })));
              }}
            />
            <span>Expected</span>
            <button
              type="button"
              onClick={addEmpty}
              className="px-3 py-1.5 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              + Step
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={!steps.length}
              className="px-3 py-1.5 rounded-md text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {mode === "simple" ? (
        <textarea
          value={simpleRaw}
          onChange={(e) => {
            const v = e.target.value;
            setSimpleRaw(v);
            const chunks = splitSteps(v);
            onChange(chunks.map((a) => ({ action: a, expected: "" })));
          }}
          placeholder={`Open /login\nType email\nClick "Login"`}
          className="w-full min-h-[160px] rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none resize-y focus:border-sky-400 focus:ring-1 focus:ring-sky-100 dark:border-slate-700 dark:text-slate-200 dark:focus:border-cyan-400 dark:focus:ring-1 dark:focus:ring-cyan-900/40"
        />
      ) : (
        <>
          <div className="space-y-3">
            <textarea
              placeholder="Quick add multiple steps…"
              onKeyDown={(e) => {
                if ((e.key === "Enter" && !e.shiftKey) || e.key === ";") {
                  e.preventDefault();
                  const target = e.target as HTMLTextAreaElement;
                  const raw = target.value.trim();
                  if (!raw) return;
                  bulkAdd(raw);
                  target.value = "";
                }
              }}
              className="w-full min-h-[100px] rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none resize-y focus:border-sky-400 focus:ring-1 focus:ring-sky-100 dark:border-slate-700 dark:text-slate-200 dark:focus:border-cyan-400 dark:focus:ring-1 dark:focus:ring-cyan-900/40"
            />

            <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
              {steps.length === 0 ? (
                <div className="py-3 text-sm italic text-slate-500 dark:text-slate-400">
                  No steps yet. Use <b>+ Step</b> or enter text above.
                </div>
              ) : (
                steps.map((st, i) => (
                  <StepItem
                    key={i}
                    index={i}
                    value={st}
                    expectedOn={expectedOn}
                    onChange={(next) => {
                      const arr = [...steps];
                      arr[i] = expectedOn ? next : { ...next, expected: "" };
                      onChange(arr);
                    }}
                    onDelete={() => {
                      const arr = [...steps];
                      arr.splice(i, 1);
                      onChange(arr);
                    }}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("ring-1", "ring-cyan-400/40");
                    }}
                    onDragLeave={(e) =>
                      e.currentTarget.classList.remove("ring-1", "ring-cyan-400/40")
                    }
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("ring-1", "ring-cyan-400/40");
                      if (dragIndex === null) return;
                      const arr = [...steps];
                      const [it] = arr.splice(dragIndex, 1);
                      arr.splice(i, 0, it);
                      onChange(arr);
                      setDragIndex(null);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
