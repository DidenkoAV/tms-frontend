import { StepsEditor, type StepForm } from "@/features/test-cases";

type Props = {
  steps: StepForm[];
  onChange: (steps: StepForm[]) => void;
  className?: string;
};

export type { StepForm };

export default function CaseStepsBlock({ steps, onChange, className }: Props) {
  return (
    <div
      className={
        [
          "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
          "dark:border-slate-800 dark:bg-[#0f1524]",
          className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <StepsEditor steps={steps} onChange={onChange} />
    </div>
  );
}
