// src/shared/ui/table/TableRowActions.tsx
import { IconButton } from "@/shared/ui/buttons";
import type { IconButtonProps } from "@/shared/ui/buttons/IconButton/IconButton.types";

export type TableRowAction = {
  key: React.Key;
  title: string;
  icon: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: IconButtonProps["variant"];
  size?: IconButtonProps["size"];
  disabled?: boolean;
  hidden?: boolean;
};

interface TableRowActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  actions: TableRowAction[];
  stopPropagation?: boolean;
}

const BASE_CLASS =
  "flex items-center justify-end gap-1 dark:[&>button]:text-slate-300 dark:[&>button:hover]:text-white";

export default function TableRowActions({
  actions,
  className = "",
  stopPropagation = true,
  ...rest
}: TableRowActionsProps) {
  const composedClassName = [BASE_CLASS, className].filter(Boolean).join(" ");
  const visibleActions = actions.filter((action) => !action.hidden);

  return (
    <div className={composedClassName} {...rest}>
      {visibleActions.map(({ key, icon, title, onClick, variant, size, disabled }) => (
        <IconButton
          key={key}
          variant={variant}
          size={size}
          title={title}
          disabled={disabled}
          onClick={(event) => {
            if (stopPropagation) event.stopPropagation();
            onClick?.(event);
          }}
        >
          {icon}
        </IconButton>
      ))}
    </div>
  );
}
