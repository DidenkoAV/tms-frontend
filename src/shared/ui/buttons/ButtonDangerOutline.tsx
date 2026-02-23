import * as React from "react";

export type ButtonDangerOutlineProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const ButtonDangerOutline = React.forwardRef<HTMLButtonElement, ButtonDangerOutlineProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={[
          "inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-xs transition",
          "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100",
          "dark:bg-transparent dark:text-rose-200 dark:border-rose-500/40 dark:hover:bg-rose-900/30",
          className,
        ].join(" ")}
      />
    );
  }
);

ButtonDangerOutline.displayName = "ButtonDangerOutline";

