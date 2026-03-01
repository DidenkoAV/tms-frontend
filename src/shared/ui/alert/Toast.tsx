import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, OctagonAlert, TriangleAlert, X } from "lucide-react";

type ToastKind = "info" | "success" | "warning" | "error";

type ToastItem = {
  id: number;
  kind: ToastKind;
  text: string;
  title?: string;
};

type ToastOptions = {
  title?: string;
  durationMs?: number;
};

type ToastApi = {
  show: (kind: ToastKind, text: string, options?: ToastOptions) => void;
  info: (text: string, options?: ToastOptions) => void;
  success: (text: string, options?: ToastOptions) => void;
  warning: (text: string, options?: ToastOptions) => void;
  error: (text: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const tone = {
  info: {
    border: "border-sky-300/70 dark:border-sky-500/30",
    bg: "bg-sky-50/95 dark:bg-[#0f1524]/95",
    text: "text-sky-900 dark:text-sky-100",
    sub: "text-sky-700/90 dark:text-sky-300/90",
    icon: Info,
  },
  success: {
    border: "border-emerald-300/70 dark:border-emerald-500/30",
    bg: "bg-emerald-50/95 dark:bg-[#0f1524]/95",
    text: "text-emerald-900 dark:text-emerald-100",
    sub: "text-emerald-700/90 dark:text-emerald-300/90",
    icon: CheckCircle2,
  },
  warning: {
    border: "border-amber-300/70 dark:border-amber-500/30",
    bg: "bg-amber-50/95 dark:bg-[#0f1524]/95",
    text: "text-amber-900 dark:text-amber-100",
    sub: "text-amber-700/90 dark:text-amber-300/90",
    icon: TriangleAlert,
  },
  error: {
    border: "border-rose-300/70 dark:border-rose-500/30",
    bg: "bg-rose-50/95 dark:bg-[#0f1524]/95",
    text: "text-rose-900 dark:text-rose-100",
    sub: "text-rose-700/90 dark:text-rose-300/90",
    icon: OctagonAlert,
  },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((kind: ToastKind, text: string, options?: ToastOptions) => {
    const id = Date.now() + Math.floor(Math.random() * 10_000);
    const durationMs = options?.durationMs ?? (kind === "error" ? 5000 : 3200);
    setItems((prev) => [...prev, { id, kind, text, title: options?.title }]);
    window.setTimeout(() => remove(id), durationMs);
  }, [remove]);

  const api = useMemo<ToastApi>(() => ({
    show,
    info: (text, options) => show("info", text, options),
    success: (text, options) => show("success", text, options),
    warning: (text, options) => show("warning", text, options),
    error: (text, options) => show("error", text, options),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[1200] flex w-[min(92vw,420px)] flex-col gap-2">
          {items.map((item) => {
            const style = tone[item.kind];
            const Icon = style.icon;
            return (
              <div
                key={item.id}
                role="status"
                className={[
                  "pointer-events-auto rounded-2xl border p-3 shadow-xl backdrop-blur-lg",
                  "animate-[toast-in_220ms_ease-out] transition-transform",
                  style.border,
                  style.bg,
                ].join(" ")}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${style.sub}`} />
                  <div className="min-w-0 flex-1">
                    {item.title ? (
                      <div className={`mb-0.5 text-sm font-semibold ${style.text}`}>{item.title}</div>
                    ) : null}
                    <div className={`text-sm leading-snug ${style.sub}`}>{item.text}</div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close notification"
                    onClick={() => remove(item.id)}
                    className="rounded-md p-1 text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          <style>{`
            @keyframes toast-in {
              from { opacity: 0; transform: translateY(-8px) scale(.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

