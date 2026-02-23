import { IconBase, type IconProps } from "./IconBase";

export function GridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5"/>
    </IconBase>
  );
}
