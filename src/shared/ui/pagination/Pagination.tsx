interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number; // ← make optional
  pageSize: number;
  setPage: (v: number | ((p: number) => number)) => void;
  setPageSize: (v: number) => void;
  className?: string;
}

/** Clean Pagination without "Showing ..." label */
export default function Pagination({
  page,
  totalPages,
  pageSize,
  setPage,
  setPageSize,
  className = "",
}: PaginationProps) {
  return (
    <div
      className={`flex flex-col gap-3 p-3 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 text-sm ${className}`}
    >
      {/* --- Left side (rows per page) --- */}
      <div className="flex items-center text-slate-600 dark:text-slate-300">
        <label className="flex items-center gap-2">
          Rows per page:
          <select
            className="px-2 py-1 bg-white border rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={50}>50</option>
            <option value={0}>All</option>
          </select>
        </label>
      </div>

      {/* --- Right side (pagination controls) --- */}
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 bg-white border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>

        <span className="text-slate-700 dark:text-slate-200">
          {page} / {totalPages}
        </span>

        <button
          className="px-2 py-1 bg-white border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
