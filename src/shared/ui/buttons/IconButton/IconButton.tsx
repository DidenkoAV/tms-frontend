import * as React from "react";
import { IconButtonProps } from "./IconButton.types";

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = "", variant = "soft", size = "md", title, type, ...rest }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-2xl border transition select-none " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 disabled:opacity-50";

    const tone =
      variant === "danger"
        ? "border-rose-300 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-400 " +
          "dark:border-white/70 dark:hover:border-white dark:text-white dark:bg-transparent dark:hover:bg-white/10"
        : variant === "ghost"
        ? "border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400 " +
          "dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        : "border-slate-300 text-slate-700 bg-white/80 hover:bg-white hover:border-slate-400 " +
          "dark:border-slate-600 dark:text-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800";

    const sz =
      size === "sm" ? "h-7 w-7 text-[13px]" :
      size === "lg" ? "h-9 w-9 text-[15px]" :
      "h-8 w-8 text-[14px]";

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        title={title}
        aria-label={title}
        className={`${base} ${tone} ${sz} ${className}`}
        {...rest}
      />
    );
  }
);

IconButton.displayName = "IconButton";
