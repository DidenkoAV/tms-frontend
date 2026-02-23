import * as React from "react";
import { forwardRef, useEffect, useRef } from "react";


type Props = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
  title?: string;
  className?: string;
  stop?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked" | "defaultChecked">;

export const TFCheckbox = forwardRef<HTMLInputElement, Props>(function TFCheckbox(
  { checked, defaultChecked, onChange, title, className = "", stop, disabled, indeterminate = false, size = 18, ...rest },
  ref
) {
  const innerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);

  function setRefs(node: HTMLInputElement | null) {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
  }

  const boxStyle = { width: size, height: size };
  const markWH = Math.round(size * 0.9);
  const dashH = Math.max(2, Math.round(size * 0.12));
  const dashW = Math.round(size * 0.6);

  return (
    <label
      title={title}
      className={`relative inline-grid cursor-pointer select-none place-items-center ${className}`}
      style={boxStyle}
      onClick={(e) => { if (stop) e.stopPropagation(); }}
    >
      <input
        ref={setRefs}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        aria-checked={indeterminate ? "mixed" : checked}
        {...rest}
      />

      {/* box */}
      <span
        className={[
          "rounded-md border shadow-sm",
          // basic border/background
          "border-slate-300 bg-white dark:border-slate-600 dark:bg-transparent",
          // SELECTED: light - BLACK, dark - WHITE
          "peer-checked:bg-black peer-checked:border-black",
          "dark:peer-checked:bg-white/95 dark:peer-checked:border-white",
          // keyboard focus
          "peer-focus-visible:outline-none peer-focus-visible:ring-2",
          "peer-focus-visible:ring-slate-900/30 dark:peer-focus-visible:ring-white/40",
          "disabled:opacity-50"
        ].join(" ")}
        style={boxStyle}
        aria-hidden
      />

      {/* indeterminate dash */}
      {indeterminate && !checked && (
        <span
          className="absolute rounded pointer-events-none bg-slate-600 dark:bg-white"
          style={{ width: dashW, height: dashH }}
          aria-hidden
        />
      )}

      {/* checkmark */}
      <svg
        viewBox="0 0 24 24"
        className="absolute text-white transition opacity-0 pointer-events-none peer-checked:opacity-100 dark:text-slate-900"
        width={markWH}
        height={markWH}
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
});
