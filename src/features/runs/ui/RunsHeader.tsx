import TableHeaderActions from "@/shared/ui/table/TableHeaderActions";
import SearchInput from "@/shared/ui/search/SearchInput";

type VisibleCols = { status: boolean; author: boolean };

interface RunsHeaderProps {
  totalItems: number;
  selectedCount: number;
  onBulkDelete: () => void;
  onNewRun: () => void;
  cols: VisibleCols;
  setCols: (v: VisibleCols) => void;
  q: string;
  onSearch: (v: string) => void;
}

export default function RunsHeader({
  selectedCount,
  onBulkDelete,
  onNewRun,
  cols,
  setCols,
  q,
  onSearch,
}: RunsHeaderProps) {
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
          Runs
        </h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Recent execution results
        </p>
      </div>

      {/* --- Search and buttons --- */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SearchInput
            value={q}
            onChange={onSearch}
            placeholder="Search"
            className="w-80"
            storageKey="runs.search"
            ariaLabel="Search runs"
          />
        </div>

        <TableHeaderActions
          selectedCount={selectedCount}
          onBulkDelete={onBulkDelete}
          onToggleCreate={onNewRun}
          showCreate={false}
          cols={cols}
          setCols={(v) => setCols(v as VisibleCols)}
          createLabel="New Run"
          className="ml-4"
          items={[
            { key: "status", label: "Status" },
            { key: "author", label: "Author" },
          ]}
          deleteVariant="icon"
          buttonSize="sm"
        />
      </div>

      {/* --- Legend --- */}
      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0f1524]">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M12 10v7M12 7h.01"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            Legend:
          </span>
          {[
            { label: "Passed", color: "bg-emerald-500" },
            { label: "Failed", color: "bg-rose-500" },
            { label: "Retest", color: "bg-amber-400" },
            { label: "Skipped", color: "bg-sky-500" },
            { label: "Broken", color: "bg-slate-500" },
          ].map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-2 px-2 py-1 text-xs border rounded-md border-slate-300 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <span className={`h-2.5 w-4 rounded ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </section>
    </header>
  );
}
