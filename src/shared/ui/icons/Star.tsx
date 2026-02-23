import { IconBase, type IconProps } from "./IconBase";

type StarProps = IconProps & { filled?: boolean };

const STAR_GOLD = "var(--tf-star-gold, #f5c518)";

export function StarIcon({ filled, ...props }: StarProps) {
  return (
    <IconBase {...props}>
      <path
        d="M12 3l2.9 5.9 6.5.9-4.7 4.5 1.1 6.4L12 17.8 6.2 20.7l1.1-6.4L2.6 9.8l6.5-.9L12 3z"
        stroke={STAR_GOLD}
        strokeWidth="1.6"
        fill={filled ? STAR_GOLD : "none"}
      />
    </IconBase>
  );
}
