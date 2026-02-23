
interface Props extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  selectedClassName?: string;
  hoverClassName?: string;
  children: React.ReactNode;
}

export default function RowHighlight({
  selected,
  selectedClassName = "bg-emerald-50 dark:bg-emerald-900/30",
  hoverClassName = "hover:bg-slate-50/70 dark:hover:bg-slate-900/30",
  children,
  className = "",
  ...rest
}: Props) {
  const baseClass = "border-t border-slate-200/70 dark:border-slate-800/70";
  const hoverClass = hoverClassName?.trim().length ? hoverClassName : "";
  const highlightClass = selected && selectedClassName ? selectedClassName : "";

  return (
    <tr
      {...rest}
      className={[baseClass, hoverClass, highlightClass, className].filter(Boolean).join(" ")}
    >
      {children}
    </tr>
  );
}
