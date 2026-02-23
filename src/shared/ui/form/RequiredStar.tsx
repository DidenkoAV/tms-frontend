interface Props {
  className?: string;
}

export default function RequiredStar({ className = "" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={[
        "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-[11px] font-semibold leading-none text-rose-600",
        "dark:bg-rose-900/30 dark:text-rose-200",
        className,
      ].join(" ")}
      title="Required"
    >
      *
    </span>
  );
}
