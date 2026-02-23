import { forwardRef } from "react";

type BadgeTone =
  | "slate"
  | "emerald"
  | "indigo"
  | "amber"
  | "rose"
  | "red"
  | "cyan"
  | "violet";

const toneClasses: Record<BadgeTone, string> = {
  slate: "border-slate-300 bg-white/70 text-slate-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  red: "border-red-200 bg-red-50 text-red-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-lg border text-[11px] font-medium transition-colors px-2 py-0.5";
const darkClasses = "dark:border-slate-700 dark:bg-transparent dark:text-white";
const interactiveClasses =
  "cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 dark:focus:ring-slate-600";

// ✅ fixed width for uniform badge size
// sized for longest words (Performance / Automated)
const fixedSizeClasses = "min-w-[90px] max-w-[90px] text-center";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type CaseBadgePrimitiveProps = {
  label: string;
  tone: BadgeTone;
  interactive?: boolean;
  showCaret?: boolean;
  className?: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const CaseBadgePrimitive = forwardRef<
  HTMLButtonElement | HTMLSpanElement,
  CaseBadgePrimitiveProps
>(function CaseBadgePrimitive(
  { label, tone, interactive, showCaret, className, title, onClick },
  ref
) {
  const cls = cx(
    baseClasses,
    fixedSizeClasses,
    toneClasses[tone],
    darkClasses,
    interactive && interactiveClasses,
    className
  );

  if (interactive) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={cls}
        title={title}
        onClick={onClick}
      >
        <span className="truncate">{label}</span>
        {showCaret && <span className="ml-1 opacity-70">▾</span>}
      </button>
    );
  }

  return (
    <span ref={ref as React.Ref<HTMLSpanElement>} className={cls} title={title}>
      <span className="truncate">{label}</span>
      {showCaret && <span className="ml-1 opacity-70">▾</span>}
    </span>
  );
});

export type CasePriorityLabel = "Low" | "Medium" | "High" | "Critical";
export type CaseTypeLabel =
  | "Functional"
  | "Regression"
  | "Smoke"
  | "Security"
  | "Performance"
  | "Other";
export type CaseAutomationLabel = "Manual" | "WIP" | "Automated";

export const CASE_PRIORITY_BY_ID: Record<number, CasePriorityLabel> = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

export const CASE_TYPE_BY_ID: Record<number, CaseTypeLabel> = {
  1: "Functional",
  2: "Regression",
  3: "Smoke",
  4: "Security",
  5: "Performance",
  6: "Other",
};

export const CASE_AUTOMATION_BY_KEY: Record<string, CaseAutomationLabel> = {
  NOT_AUTOMATED: "Manual",
  IN_PROGRESS: "WIP",
  AUTOMATED: "Automated",
};

export const CASE_AUTOMATION_LABELS: CaseAutomationLabel[] = [
  "Manual",
  "WIP",
  "Automated",
];

const priorityTone: Record<CasePriorityLabel, BadgeTone> = {
  Low: "slate",
  Medium: "violet",
  High: "amber",
  Critical: "red",
};

const typeTone: Record<CaseTypeLabel, BadgeTone> = {
  Functional: "cyan",
  Regression: "indigo",
  Smoke: "emerald",
  Security: "violet",
  Performance: "amber",
  Other: "slate",
};

const automationTone: Record<CaseAutomationLabel, BadgeTone> = {
  Manual: "slate",
  WIP: "indigo",
  Automated: "emerald",
};

export function priorityLabelFromId(
  id?: number | null,
  fallback: CasePriorityLabel = "Medium"
): CasePriorityLabel {
  return CASE_PRIORITY_BY_ID[id ?? 0] ?? fallback;
}

export function typeLabelFromId(
  id?: number | null,
  fallback: CaseTypeLabel = "Functional"
): CaseTypeLabel {
  return CASE_TYPE_BY_ID[id ?? 0] ?? fallback;
}

export function automationLabelFromStatus(
  status?: string | null,
  fallback: CaseAutomationLabel = "Manual"
): CaseAutomationLabel {
  return CASE_AUTOMATION_BY_KEY[status ?? ""] ?? fallback;
}

type CommonBadgeProps = {
  interactive?: boolean;
  showCaret?: boolean;
  className?: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export const CasePriorityBadge = forwardRef<
  HTMLButtonElement | HTMLSpanElement,
  { priority: CasePriorityLabel } & CommonBadgeProps
>(function CasePriorityBadge({ priority, ...rest }, ref) {
  return (
    <CaseBadgePrimitive
      ref={ref}
      label={priority}
      tone={priorityTone[priority]}
      {...rest}
    />
  );
});

export const CaseTypeBadge = forwardRef<
  HTMLButtonElement | HTMLSpanElement,
  { type: CaseTypeLabel } & CommonBadgeProps
>(function CaseTypeBadge({ type, ...rest }, ref) {
  return (
    <CaseBadgePrimitive
      ref={ref}
      label={type}
      tone={typeTone[type]}
      {...rest}
    />
  );
});

export const CaseAutomationBadge = forwardRef<
  HTMLButtonElement | HTMLSpanElement,
  { automation: CaseAutomationLabel } & CommonBadgeProps
>(function CaseAutomationBadge({ automation, ...rest }, ref) {
  return (
    <CaseBadgePrimitive
      ref={ref}
      label={automation}
      tone={automationTone[automation]}
      {...rest}
    />
  );
});
