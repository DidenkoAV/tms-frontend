import * as React from "react";

export type IconProps = {
  size?: number;           // size in px
  className?: string;      // styles (color: text-slate-500 etc.)
  title?: string;          // accessible name (if needed)
} & React.SVGProps<SVGSVGElement>;

export const IconBase = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 16, className = "", title, children, ...rest }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
);
IconBase.displayName = "IconBase";
