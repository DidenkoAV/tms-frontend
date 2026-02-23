import * as React from "react";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "soft" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
};
