// src/ui/icons/TrashIcon.tsx
import { IconBase, type IconProps } from "./IconBase";

/**
 * Elegant Trash Icon — modern minimalist version.
 * - Balanced proportions
 * - Softer strokes (1.5)
 * - Adaptive color for both themes
 */
export function TrashIcon({ className, ...props }: IconProps) {
  return (
    <IconBase
      {...props}
      className={[
        "text-rose-500/90 dark:text-rose-400/90 transition-colors duration-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Lid */}
      <path
        d="M9.5 4h5a1 1 0 0 1 1 1v1H8.5V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Handle */}
      <path
        d="M10 3.2h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Body */}
      <path
        d="M6.8 6.8h10.4l-.9 11.2a2 2 0 0 1-2 1.8H9.7a2 2 0 0 1-2-1.8L6.8 6.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner lines */}
      <path
        d="M10 10.8v6M14 10.8v6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </IconBase>
  );
}
