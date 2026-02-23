import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ==================== Types ==================== */
type ConfirmOpts = {
  title?: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
};

type State = { text: string; onOk: () => void; opts: ConfirmOpts } | null;

/* ==================== Icons ==================== */
function IconCircleQuestion(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" opacity=".5" />
      <path
        d="M9.8 9.2a2.3 2.3 0 114.4 1.1c-.5 1-1.8 1.1-2 2.5v.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.3" r="1" fill="currentColor" />
    </svg>
  );
}

function IconTriangleWarning(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3l9 16H3L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity=".6"
      />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" />
    </svg>
  );
}

/* ==================== Hook ==================== */
export function useConfirm(defaults?: ConfirmOpts) {
  const [state, setState] = useState<State>(null);
  const okRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback(
    (text: string, onOk: () => void, opts?: ConfirmOpts) => {
      setState({ text, onOk, opts: { ...defaults, ...opts } });
    },
    [defaults]
  );

  const close = useCallback(() => setState(null), []);

  useEffect(() => {
    if (!state) return;
    const id = requestAnimationFrame(() => okRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [state]);

  const ui = useMemo(() => {
    if (!state) return null;
    const { title = "Confirm", okText = "OK", cancelText = "Cancel", danger } = state.opts || {};

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Enter") {
        e.preventDefault();
        state.onOk();
        close();
      }
    };

    const iconColor = danger
      ? "text-rose-500 dark:text-rose-400"
      : "text-slate-500 dark:text-slate-400";

    const okButton =
      danger
        ? "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-300 dark:bg-rose-500 dark:hover:bg-rose-400"
        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white";

    return createPortal(
      <>
        <style>
          {`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideIn { from { opacity: 0; transform: translateY(6px) scale(.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
          `}
        </style>

        <div
          className="fixed inset-0 z-[999] grid place-items-center bg-black/40 backdrop-blur-[2px]"
          style={{ animation: "fadeIn 120ms ease-out both" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          onKeyDown={onKeyDown}
          role="none"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-[min(460px,90vw)] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#0f1524]"
            style={{ animation: "slideIn 150ms cubic-bezier(.2,.9,.2,1) both" }}
          >
            <div className="flex items-start gap-4">
              <span className={`grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 ${iconColor}`}>
                {danger ? <IconTriangleWarning width={20} height={20} /> : <IconCircleQuestion width={20} height={20} />}
              </span>

              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
                <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-300">
                  {state.text}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={close}
                className="px-4 py-2 text-sm font-medium bg-white border rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 active:translate-y-px dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {cancelText}
              </button>
              <button
                ref={okRef}
                onClick={() => { state.onOk(); close(); }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 ${okButton}`}
              >
                {okText}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }, [state, close]);

  return { open, close, ui };
}
