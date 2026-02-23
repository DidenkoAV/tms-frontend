import PillSelect, { type PillOption } from "@/shared/ui/select/DropdownSelect";
import TagChips from "@/shared/ui/tags/TagChips";
import { FolderIcon } from "@/shared/ui/icons";

import type {
  PriorityLabel,
  CaseTypeLabel,
  AutomationLabel,
} from "@/entities/test-case";

type StatusOption = { value: string; label?: string };

interface Props {
  priority: PriorityLabel;
  type: CaseTypeLabel;
  automation: AutomationLabel;
  estimate: string;
  tags: string[];

  onChangePriority: (value: PriorityLabel) => void;
  onChangeType: (value: CaseTypeLabel) => void;
  onChangeAutomation: (value: AutomationLabel) => void;
  onChangeEstimate: (value: string) => void;
  onChangeTags: (next: string[]) => void;

  suiteName?: string | null;
  showSuite?: boolean;

  status?: string;
  onChangeStatus?: (value: string) => void;
  statusOptions?: StatusOption[];

  testData?: string;
  onChangeTestData?: (value: string) => void;

  attachments?: File[];
  onChangeAttachments?: (files: File[]) => void;

  className?: string;
}

const PRIORITY_OPTIONS: PillOption<PriorityLabel>[] = [
  { value: "Low" },
  { value: "Medium" },
  { value: "High" },
  { value: "Critical" },
];

const TYPE_OPTIONS: PillOption<CaseTypeLabel>[] = [
  { value: "Functional" },
  { value: "Regression" },
  { value: "Smoke" },
  { value: "Security" },
  { value: "Performance" },
  { value: "Other" },
];

const AUTOMATION_OPTIONS: PillOption<AutomationLabel>[] = [
  { value: "Manual" },
  { value: "In progress" },
  { value: "Automated" },
];

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { value: "Passed" },
  { value: "Blocked" },
  { value: "Retest" },
  { value: "Failed" },
];

export default function CaseMeta({
  priority,
  type,
  automation,
  estimate,
  tags,
  onChangePriority,
  onChangeType,
  onChangeAutomation,
  onChangeEstimate,
  onChangeTags,
  suiteName,
  showSuite = true,
  status,
  onChangeStatus,
  statusOptions,
  testData,
  onChangeTestData,
  attachments,
  onChangeAttachments,
  className,
}: Props) {
  const mergedStatusOptions = statusOptions ?? DEFAULT_STATUS_OPTIONS;

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        "dark:border-slate-800 dark:bg-[#0f1524]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        Meta
      </h3>

      <div className="grid gap-3">
        <PillSelect
          label="Priority"
          value={priority}
          onChange={onChangePriority}
          options={PRIORITY_OPTIONS}
        />

        <PillSelect
          label="Type"
          value={type}
          onChange={onChangeType}
          options={TYPE_OPTIONS}
        />

        <PillSelect
          label="Automation"
          value={automation}
          onChange={onChangeAutomation}
          options={AUTOMATION_OPTIONS}
        />

        {onChangeStatus && (
          <PillSelect
            label="Status"
            value={status ?? mergedStatusOptions[0]?.value ?? ""}
            onChange={onChangeStatus}
            options={mergedStatusOptions.map((opt) => ({ value: opt.value }))}
          />
        )}

        <div>
          <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">
            Estimate
          </label>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-cyan-400"
            placeholder="e.g. 30s, 5m, 1h, 2d, 1w"
            value={estimate}
            onChange={(e) => onChangeEstimate(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">
            Tags
          </label>
          <TagChips tags={tags} editable onChange={onChangeTags} size="sm" />
        </div>

        {showSuite && suiteName ? (
          <div className="pt-1 text-sm">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <FolderIcon className="text-slate-500" />
              <span className="font-medium">Suite</span>
              <span className="text-slate-900 dark:text-slate-100">• {suiteName}</span>
            </span>
          </div>
        ) : null}
      </div>

      {onChangeTestData && (
        <div className="mt-4">
          <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">
            Test data
          </label>
          <textarea
            className="min-h-[90px] w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-cyan-400"
            value={testData ?? ""}
            onChange={(e) => onChangeTestData(e.target.value)}
            placeholder="user: test@example.com, pass: secret"
          />
        </div>
      )}

      {onChangeAttachments && (
        <div className="mt-4">
          <label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">
            Attachments
          </label>
          <input
            type="file"
            multiple
            className="w-full text-xs text-slate-700 file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-3 file:py-1 file:text-slate-700 dark:text-slate-300 dark:file:border-slate-700 dark:file:bg-slate-900 dark:file:text-slate-200"
            onChange={(e) => onChangeAttachments(Array.from(e.target.files ?? []))}
          />
          {attachments && attachments.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1 text-xs text-slate-600 dark:text-slate-300">
              {attachments.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900"
                >
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
