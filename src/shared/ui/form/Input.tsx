import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={[
          "w-full rounded-md border px-3 py-2 text-sm outline-none transition",
          "bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400/30",
          "dark:bg-[#0b1222] dark:text-slate-100 dark:border-slate-800 dark:placeholder:text-slate-500 dark:focus-visible:ring-slate-500/30",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-400",
          props.className || "",
        ].join(" ")}
      />
    );
  }
);

Input.displayName = "Input";

