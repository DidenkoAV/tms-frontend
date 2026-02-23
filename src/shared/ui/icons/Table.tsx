import { IconBase, type IconProps } from "./IconBase";

export function TableIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 9h18M3 14h18M8 20V4M16 20V4" stroke="currentColor" strokeWidth="1.5"/>
    </IconBase>
  );
}