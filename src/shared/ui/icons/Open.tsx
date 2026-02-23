import { IconBase, type IconProps } from "./IconBase";

export function OpenIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 4h6v6M10 14l10-10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 14v5a1 1 0 0 1-1 1h-5" stroke="currentColor" strokeWidth="1.2" opacity=".7"/>
    </IconBase>
  );
}
