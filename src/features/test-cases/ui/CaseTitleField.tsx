import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import RequiredStar from "@/shared/ui/form/RequiredStar";

interface BaseProps {
  backHref: string;
  backLabel: string;
  heading: string;
  badge?: string;
  note?: string;
  actions?: ReactNode;
}

interface EditProps extends BaseProps {
  mode: "edit";
  title: string;
  error?: string;
  onChangeTitle: (next: string) => void;
  onSave: (closeAfter?: boolean) => void;
  saving: boolean;
  isValid: boolean;
  showSaveAndClose?: boolean;
}

interface ViewProps extends BaseProps {
  mode?: "view";
}

export type CaseTitleFieldProps = EditProps | ViewProps;

export default function CaseTitleField(props: CaseTitleFieldProps) {
  const { backHref, backLabel, heading, badge, note } = props;

  return (
    <section className="mb-6 flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={backHref}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline dark:text-slate-400"
          >
            ← {backLabel}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {heading}
            </h1>
            {badge && (
              <span className="inline-flex items-center rounded-2xl border border-slate-300 px-2 py-0.5 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>

          {props.mode === "edit" && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {note ?? (
                <span>
                  Required fields <span className="mx-1">are marked with</span>
                  <RequiredStar />
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {props.mode === "edit" ? (
            <>
              <button
                onClick={() => props.onSave(false)}
                disabled={!props.isValid || props.saving}
                className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
              >
                {props.saving ? "Saving…" : "Save"}
              </button>
              {(props.showSaveAndClose ?? true) && (
                <button
                  onClick={() => props.onSave(true)}
                  disabled={!props.isValid || props.saving}
                  className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  Save & Close
                </button>
              )}
              {props.actions}
            </>
          ) : (
            props.actions
          )}
        </div>
      </header>

      {props.mode === "edit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0f1524]">
          <label htmlFor="case-title" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Title <RequiredStar />
          </label>
          <input
            id="case-title"
            type="text"
            value={props.title}
            onChange={(e) => props.onChangeTitle(e.target.value)}
            placeholder="Login → Successful authentication"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-2 dark:focus:ring-cyan-900/40"
          />
          {props.error ? (
            <p className="mt-2 text-xs font-medium text-rose-500">{props.error}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              This name appears in lists, runs, and reports.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
