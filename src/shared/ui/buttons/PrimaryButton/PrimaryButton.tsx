import * as React from "react";
import { PrimaryButtonProps } from "./PrimaryButton.types";

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className = "", size = "md", type, ...rest }, ref) => {
    const base =
      "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white text-slate-700 " +
      "shadow-sm transition hover:bg-slate-50 active:translate-y-px disabled:opacity-60 " +
      "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

    const pad =
      size === "sm" ? "px-3 py-1.5 text-sm" :
      size === "lg" ? "px-5 py-2.5 text-base" :
      "px-4 py-2 text-sm";

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={`${base} ${pad} ${className}`}
        {...rest}
      />
    );
  }
);

PrimaryButton.displayName = "PrimaryButton";
