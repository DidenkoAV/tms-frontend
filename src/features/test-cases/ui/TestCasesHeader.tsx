import { useMemo, type ReactNode } from "react";
import SearchInput from "@/shared/ui/search/SearchInput";
import TableHeaderActions from "@/shared/ui/table/TableHeaderActions";

type ColKey = "priority" | "type" | "automation" | "author";

interface Props {
  q: string;
  onSearch: (val: string) => void;

  cols: Record<ColKey, boolean>;
  setCols: (next: Record<ColKey, boolean>) => void;

  selectedSuites: Set<number>;
  selectedCases: Set<number>;
  onBulkDelete: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  totalSuites?: number;
  totalCases?: number;
  onNewSuite: () => void;

  extraRight?: ReactNode;
}

export default function TestCasesHeader({
  q,
  onSearch,
  cols,
  setCols,
  selectedSuites,
  selectedCases,
  onBulkDelete,
  onSelectAll,
  onDeselectAll,
  totalSuites = 0,
  totalCases = 0,
  onNewSuite,
  extraRight,
}: Props) {
  const selectedCount = selectedSuites.size + selectedCases.size;
  const totalCount = totalSuites + totalCases;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const colItems = useMemo(
    () => [
      { key: "priority", label: "Priority" },
      { key: "type", label: "Type" },
      { key: "automation", label: "Automation" },
      { key: "author", label: "Author" },
    ],
    []
  );

  return (
    <header className="flex flex-col gap-3 mb-6">
      <div>
        <button
          onClick={() => history.back()}
          className="mb-1 text-xs text-slate-500 hover:underline dark:text-slate-400"
        >
          ← Back to project
        </button>

        <h1 className="flex items-center gap-1 text-[22px] font-semibold text-slate-900 dark:text-slate-100">
          Test Cases
        </h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Organize and manage your test cases
        </p>
      </div>

      <div className="flex items-center justify-between">
        <SearchInput
          value={q}
          onChange={onSearch}
          placeholder="Search"
          storageKey="cases.search.global"
          className="w-80"
          ariaLabel="Search cases"
        />

        <div className="flex items-center gap-3">
          <TableHeaderActions
            selectedCount={selectedCount}
            onBulkDelete={onBulkDelete}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            allSelected={allSelected}
            onToggleCreate={onNewSuite}
            createLabel="New Suite"
            cols={cols}
            setCols={setCols}
            items={colItems}
            alwaysShowCreateLabel
            deleteVariant="icon"
            buttonSize="sm"
          />

          {extraRight}
        </div>
      </div>
    </header>
  );
}
