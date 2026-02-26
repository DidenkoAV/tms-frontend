// src/shared/ui/table/TableHeaderActions.tsx
import ColumnsMenu from "@/shared/ui/columns/ColumnsMenu";
import { TrashIcon, PlusIcon } from "@/shared/ui/icons";

export interface TableHeaderActionsProps<
  T extends Record<string, boolean> = Record<string, boolean>
> {
  selectedCount?: number;
  onBulkDelete?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  allSelected?: boolean;
  onToggleCreate?: () => void;
  showCreate?: boolean;
  cols?: T;
  setCols?: (v: T) => void;
  createLabel?: string;
  className?: string;
  buttonSize?: "sm" | "md" | "lg";
  fontSize?: string;
  padding?: string;
  radius?: string;
  items?: { key: string; label: string }[];
  alwaysShowCreateLabel?: boolean;
  deleteVariant?: "button" | "icon";
}

export default function TableHeaderActions<
  T extends Record<string, boolean> = Record<string, boolean>
>({
  selectedCount = 0,
  onBulkDelete,
  onSelectAll,
  onDeselectAll,
  allSelected = false,
  onToggleCreate,
  showCreate,
  cols,
  setCols,
  createLabel = "New Project",
  className = "",
  buttonSize = "md",
  fontSize,
  padding,
  radius,
  items,
  alwaysShowCreateLabel = false,
  deleteVariant = "button",
}: TableHeaderActionsProps<T>) {
  const sizePadding =
    buttonSize === "sm" ? "px-2.5" : buttonSize === "lg" ? "px-4" : "px-3";
  const sizeHeight =
    buttonSize === "sm" ? "h-7" : buttonSize === "lg" ? "h-9" : "h-8";
  const sizeSquare =
    buttonSize === "sm" ? "h-7 w-7" : buttonSize === "lg" ? "h-9 w-9" : "h-8 w-8";
  const resolvedPadding = padding ?? sizePadding;
  const resolvedRadius = radius ?? "rounded-2xl";
  const resolvedFont = fontSize ?? "text-[12px] font-medium";

  const baseButton = [
    "inline-flex items-center gap-1.5 select-none border transition-all duration-200 ease-out",
    "border-slate-200 bg-white/95 text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
    "hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2",
    "active:translate-y-0",
    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
    "dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-900",
    sizeHeight,
    resolvedRadius,
    resolvedPadding,
    resolvedFont,
  ].join(" ");

  const disabledStyles =
    "opacity-40 cursor-not-allowed pointer-events-none grayscale";

  const hasCols = cols && setCols;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* --- Select All / Deselect All Button --- */}
      {(onSelectAll || onDeselectAll) && (
        <button
          type="button"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className={baseButton}
          title={allSelected ? "Deselect all" : "Select all"}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      )}

      {/* --- Delete Button --- */}
      {onBulkDelete && deleteVariant === "button" && (
        <button
          type="button"
          onClick={onBulkDelete}
          disabled={!selectedCount}
          className={`${baseButton} ${!selectedCount ? disabledStyles : ""}`}
          title={
            selectedCount
              ? `Delete ${selectedCount} selected`
              : "Select rows to delete"
          }
        >
          <TrashIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          Delete
        </button>
      )}

      {onBulkDelete && deleteVariant === "icon" && selectedCount > 0 && (
        <button
          type="button"
          onClick={onBulkDelete}
          className={[
            "inline-flex items-center gap-1.5 select-none border transition-all duration-200 ease-out",
            "border-rose-200 bg-white/95 text-rose-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
            "hover:-translate-y-0.5 hover:shadow-md hover:border-rose-300 hover:bg-rose-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2",
            "active:translate-y-0",
            "dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-900/30",
            "dark:focus-visible:ring-rose-600 dark:focus-visible:ring-offset-slate-900",
            sizeHeight,
            resolvedRadius,
            resolvedPadding,
            resolvedFont,
          ].join(" ")}
          title={`Delete ${selectedCount} selected`}
        >
          <TrashIcon className="w-3 h-3 text-rose-500 dark:text-rose-400" />
          Delete
        </button>
      )}

      {/* --- Columns Button --- */}
      {hasCols || items ? (
        <ColumnsMenu
          items={
            items ??
            Object.keys(cols ?? {}).map((key) => ({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
            }))
          }
          value={(cols ?? {}) as Record<string, boolean>}
          onChange={(next) => setCols?.(next as T)}
          buttonLabel="Columns"
          fontSize={resolvedFont}
          padding={resolvedPadding}
          radius={resolvedRadius}
          height={sizeHeight}
        />
      ) : null}

      {/* --- Create Button --- */}
      {onToggleCreate && (
        <button
          type="button"
          onClick={onToggleCreate}
          className={baseButton}
          title={createLabel}
        >
          <PlusIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          {createLabel}
        </button>
      )}
    </div>
  );
}
