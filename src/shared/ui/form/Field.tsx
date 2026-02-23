import * as React from "react";

export interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-[13px] text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

