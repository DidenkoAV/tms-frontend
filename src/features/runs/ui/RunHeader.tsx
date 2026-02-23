/* Local Icon */
function IconBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  backLabel: string;
  onBack: () => void;
  runId: number;
  runName?: string | null;
  runDescription?: string | null;
};

export default function RunHeader({
  backLabel,
  onBack,
  runId,
  runName,
  runDescription,
}: Props) {
  return (
    <header className="mb-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 mb-1 text-xs text-slate-500 hover:underline dark:text-slate-400"
        title={backLabel}
        type="button"
      >
        <IconBack /> {backLabel}
      </button>

      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {runName || "Run"}
        <span className="ml-2 align-middle rounded-2xl border border-slate-300 px-2 py-0.5 text-[10px] text-slate-500 dark:border-slate-700">
          Run ID {runId}
        </span>
      </h1>

      {runDescription && (
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {runDescription}
        </p>
      )}
    </header>
  );
}
