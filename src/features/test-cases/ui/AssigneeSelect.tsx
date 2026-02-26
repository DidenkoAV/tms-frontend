import { useRef, useState } from "react";
import DropdownPortal, { MenuItem } from "./DropdownPortal";
import { ChevronDownIcon } from "@/shared/ui/icons";

export type AssigneeOption = {
  userId: number;
  name: string;
  email: string;
};

interface Props {
  value: number | null; // userId
  options: AssigneeOption[];
  onChange: (userId: number | null) => void;
  disabled?: boolean;
}

export default function AssigneeSelect({ value, options, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const selected = options.find((o) => o.userId === value);
  const displayName = selected?.name || selected?.email?.split('@')[0] || "—";

  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
        title="Assign to user"
      >
        <span className="truncate max-w-[90px]">{displayName}</span>
        <ChevronDownIcon className="w-3 h-3 opacity-60" />
      </button>

      <DropdownPortal
        open={open}
        anchor={btnRef.current}
        onClose={() => setOpen(false)}
        width={240}
      >
        {/* Unassign option */}
        <MenuItem
          active={value === null}
          label="— Unassigned —"
          onClick={() => {
            setOpen(false);
            onChange(null);
          }}
        />
        
        {/* Divider */}
        {options.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
        )}

        {/* User options */}
        {options.map((opt) => (
          <MenuItem
            key={opt.userId}
            active={value === opt.userId}
            label={opt.name || opt.email}
            onClick={() => {
              setOpen(false);
              onChange(opt.userId);
            }}
          />
        ))}
      </DropdownPortal>
    </div>
  );
}

