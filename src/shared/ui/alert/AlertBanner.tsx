// src/shared/ui/alert/AlertBanner.tsx
import * as React from "react";
import {
  InfoIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";

type Kind = "info" | "error" | "success" | "warning";

const KIND_STYLE: Record<
  Kind,
  {
    border: string;
    text: string;
    glow: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }
> = {
  info: {
    border: "border-sky-400/50 dark:border-sky-500/30",
    text: "text-sky-700 dark:text-sky-200",
    glow: "shadow-[0_0_20px_-6px_rgba(56,189,248,.35)]",
    Icon: InfoIcon,
  },
  success: {
    border: "border-emerald-400/50 dark:border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-200",
    glow: "shadow-[0_0_20px_-6px_rgba(16,185,129,.35)]",
    Icon: CheckCircle2Icon,
  },
  warning: {
    border: "border-amber-400/50 dark:border-amber-500/30",
    text: "text-amber-700 dark:text-amber-200",
    glow: "shadow-[0_0_20px_-6px_rgba(245,158,11,.35)]",
    Icon: AlertTriangleIcon,
  },
  error: {
    border: "border-rose-400/50 dark:border-rose-500/30",
    text: "text-rose-700 dark:text-rose-200",
    glow: "shadow-[0_0_20px_-6px_rgba(244,63,94,.35)]",
    Icon: XCircleIcon,
  },
};

export function AlertBanner({
  kind = "info",
  children,
  className = "",
}: {
  kind?: Kind;
  children: React.ReactNode;
  className?: string;
}) {
  const { border, text, glow, Icon } = KIND_STYLE[kind];

  return (
    <div
      className={[
        "group relative flex items-start gap-3 rounded-2xl border px-4 py-3 text-[15px] leading-[1.5]",
        "backdrop-blur-md transition-all duration-300",
        "bg-white/70 dark:bg-[#0f1524]/60",
        "hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-none",
        glow,
        border,
        text,
        className,
      ].join(" ")}
      style={{ animation: "fadeInAlert 200ms ease-out both" }}
    >
      <Icon className="mt-[2px] h-5 w-5 shrink-0 opacity-80" strokeWidth={1.6} />
      <div className="flex-1">{children}</div>

      <style>
        {`
          @keyframes fadeInAlert {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
