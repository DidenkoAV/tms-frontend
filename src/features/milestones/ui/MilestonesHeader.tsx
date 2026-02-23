// src/features/milestones/components/MilestonesHeader.tsx
import { useMemo } from "react";
import SearchInput from "@/shared/ui/search/SearchInput";
import TableHeaderActions from "@/shared/ui/table/TableHeaderActions";

type VisibleCols = {
  dates: boolean;
  success: boolean;
  author: boolean;
};

interface Props {
  selectedCount: number;
  onBulkDelete: () => void;
  onNewMilestone: () => void;
  q: string;
  onSearch: (value: string) => void;
  cols: VisibleCols;
  setCols: (next: VisibleCols) => void;
}

export default function MilestonesHeader({
  selectedCount,
  onBulkDelete,
  onNewMilestone,
  q,
  onSearch,
  cols,
  setCols,
}: Props) {
  // Define list of visible columns
  const colItems = useMemo(
    () => [
      { key: "dates", label: "Dates" },
      { key: "success", label: "Success" },
      { key: "author", label: "Author" },
    ],
    []
  );

  return (
    <header className="flex flex-col gap-3 mb-6">
      {/* --- Header --- */}
      <div>
        <button
          onClick={() => history.back()}
          className="mb-1 text-xs text-slate-500 hover:underline dark:text-slate-400"
        >
          ← Back to project
        </button>
        <h1 className="flex items-center gap-1 text-[22px] font-semibold text-slate-900 dark:text-slate-100">
          Milestones
        </h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Manage key releases, deadlines, or phases in your project
        </p>
      </div>

      {/* --- Search and buttons --- */}
      <div className="flex items-center justify-between">
        <SearchInput
          value={q}
          onChange={onSearch}
          placeholder="Search milestones"
          storageKey="milestones.search"
          className="w-80"
          ariaLabel="Search milestones"
        />

        {/* --- Unified action block --- */}
        <TableHeaderActions
          selectedCount={selectedCount}
          onBulkDelete={onBulkDelete}
          onToggleCreate={onNewMilestone}
          createLabel="New Milestone"
          cols={cols}
          setCols={setCols}
          items={colItems}
          deleteVariant="icon"
          buttonSize="sm"
        />
      </div>
    </header>
  );
}
