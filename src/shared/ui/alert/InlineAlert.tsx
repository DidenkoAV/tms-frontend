// src/shared/ui/feedback/InlineAlert.tsx
import type { ReactElement, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";

type Variant = "error" | "success" | "info" | "warning";

interface Props {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  withIcon?: boolean;
}

const VARIANT_CONFIG: Record<
  Variant,
  {
    light: string;
    dark: string;
    icon: ReactElement;
  }
> = {
  error: {
    light: "bg-rose-50 text-rose-800 border border-rose-200",
    dark: "dark:bg-rose-950/40 dark:text-rose-200 dark:border dark:border-rose-800/60",
    icon: <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
  },
  success: {
    light: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    dark: "dark:bg-emerald-950/40 dark:text-emerald-200 dark:border dark:border-emerald-800/60",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
  },
  info: {
    light: "bg-sky-50 text-sky-800 border border-sky-200",
    dark: "dark:bg-sky-950/40 dark:text-sky-200 dark:border dark:border-sky-800/60",
    icon: <Info className="w-4 h-4 text-sky-500 dark:text-sky-400" />,
  },
  warning: {
    light: "bg-amber-50 text-amber-800 border border-amber-200",
    dark: "dark:bg-amber-950/40 dark:text-amber-200 dark:border dark:border-amber-800/60",
    icon: <TriangleAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
  },
};

export default function InlineAlert({
  variant = "info",
  children,
  className,
  withIcon = true,
}: Props) {
  const cfg = VARIANT_CONFIG[variant];

  const classes = [
    "flex items-start gap-2 px-4 py-2.5 rounded-lg text-sm leading-relaxed",
    "border transition-all duration-300 w-full self-start",
    "mb-5",
    cfg.light,
    cfg.dark,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="alert" aria-live="polite">
      {withIcon && (
        <span className="flex-shrink-0 mt-[1px]" aria-hidden="true">
          {cfg.icon}
        </span>
      )}
      <span className="font-medium">{children}</span>
    </div>
  );
}
