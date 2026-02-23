import { IconBase, type IconProps } from "./IconBase";

export function EditIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 17.25V21h3.75L18.5 9.25l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M14.75 5.5l3.75 3.75" stroke="currentColor" strokeWidth="1.6"/>
    </IconBase>
  );
}
