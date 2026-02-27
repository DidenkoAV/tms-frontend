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
  const displayName = selected?.name || selected?.email?.split('@')[0] || "Unassigned";

  // Use teal color for assigned users, slate for unassigned
  // In dark mode, use white/transparent like other dropdowns
  const isAssigned = value !== null;
  const colorClasses = isAssigned
    ? "border-teal-200 bg-teal-50 text-teal-700 hover:shadow-sm dark:border-slate-700 dark:bg-transparent dark:text-white"
    : "border-slate-300 bg-white/70 text-slate-700 hover:shadow-sm dark:border-slate-700 dark:bg-transparent dark:text-white";

  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center rounded-lg border text-[11px] font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 dark:focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px] max-w-[110px] text-center px-2 py-0.5 ${colorClasses}`}
        title="Assign to user"
      >
        <span className="truncate">{displayName}</span>
        <span className="ml-1 opacity-70">▾</span>
      </button>

      <DropdownPortal
        open={open}
        anchor={btnRef.current}
        onClose={() => setOpen(false)}
        width={160}
      >
        {/* Unassign option */}
        <MenuItem
          active={value === null}
          label="Unassigned"
          onClick={() => {
            setOpen(false);
            onChange(null);
          }}
        />

        {/* Divider */}
        {options.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
        )}

        {/* User options - scrollable if many */}
        <div
          className="max-h-[60px] overflow-y-auto pr-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(203 213 225) transparent'
          }}
        >
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
        </div>
      </DropdownPortal>
    </div>
  );
}

