import type { TabKey } from "@/entities/group";
import { ACCOUNT_TABS } from "../config/tabs";

interface AccountSidebarProps {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
}

export function AccountSidebar({ tab, setTab }: AccountSidebarProps) {
  return (
    <aside className="self-start rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-[#0f1524] md:sticky md:top-20">
      <nav
        role="tablist"
        aria-orientation="vertical"
        className="flex gap-2 overflow-auto md:flex-col"
      >
        {ACCOUNT_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={[
                "group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                active
                  ? "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-100"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800/40 dark:hover:text-slate-100",
              ].join(" ")}
            >
              <span
                className={`flex-shrink-0 text-slate-500 dark:text-slate-400 ${
                  active ? "text-slate-900 dark:text-slate-100" : ""
                }`}
              >
                {t.icon}
              </span>
              <span className="font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

