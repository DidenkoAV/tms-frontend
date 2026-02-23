import TableHeaderActions from "@/shared/ui/table/TableHeaderActions";

interface ProjectsHeaderProps {
  totalItems: number;
  selectedCount: number;
  onBulkDelete: () => void;
  onToggleCreate: () => void;
  showCreate: boolean;
  cols: Record<string, boolean>;
  setCols: (v: Record<string, boolean>) => void;
  children?: React.ReactNode;
}

export default function ProjectsHeader({
  totalItems,
  selectedCount,
  onBulkDelete,
  onToggleCreate,
  showCreate,
  cols,
  setCols,
  children,
}: ProjectsHeaderProps) {
  return (
    <header className="flex flex-col gap-2 mb-4">
      {/* --- Header --- */}
      <div>
        <h1 className="flex items-center gap-1 text-[22px] font-semibold text-slate-900 dark:text-slate-100">
          Projects{" "}
        </h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Across all your groups
        </p>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex-1">{children}</div>

        <TableHeaderActions
          selectedCount={selectedCount}
          onBulkDelete={onBulkDelete}
          onToggleCreate={onToggleCreate}
          showCreate={showCreate}
          cols={cols}
          setCols={setCols}
          createLabel="New Project"
          className="ml-4"
          alwaysShowCreateLabel
          deleteVariant="icon"
        />
      </div>
    </header>
  );
}
