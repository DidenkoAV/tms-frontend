
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid p-4 place-items-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#0f1524]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
