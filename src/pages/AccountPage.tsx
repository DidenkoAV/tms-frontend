// src/pages/AccountPage.tsx
import { useMe, useAccountTabs, AccountSidebar, AccountTabContent } from "@/features/account";

export default function AccountPage() {
  const { me, setMe, loading, error } = useMe();
  const { tab, setTab } = useAccountTabs();

  if (loading) {
    return (
      <div className="max-w-6xl px-4 py-12 mx-auto text-slate-500 dark:text-slate-400">
        Loading account…
      </div>
    );
  }

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto text-slate-900 dark:text-slate-100">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Account</h1>

      {error && (
        <div className="px-4 py-3 mb-5 border rounded-lg border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[15rem_1fr]">
        <AccountSidebar tab={tab} setTab={setTab} />
        <AccountTabContent tab={tab} me={me} setMe={setMe} />
      </div>
    </div>
  );
}
