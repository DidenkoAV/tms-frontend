import * as React from "react";

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export function CardHeader({ title, subtitle, compact = false }: CardHeaderProps) {
  return (
    <div className={compact ? "mb-2" : "mb-3"}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {!!subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

