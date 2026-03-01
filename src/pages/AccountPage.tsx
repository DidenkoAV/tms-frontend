// src/pages/AccountPage.tsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAccountTabs, AccountSidebar, AccountTabContent } from "@/features/account";
import type { Me } from "@/entities/group";
import type { AppOutletCtx } from "@/app/types";

export default function AccountPage() {
  const { me: contextMe } = useOutletContext<AppOutletCtx>();
  const { tab, setTab } = useAccountTabs();
  const [me, setMe] = useState<Me | null>(contextMe);

  useEffect(() => {
    setMe(contextMe);
  }, [contextMe]);

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto text-slate-900 dark:text-slate-100">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Account</h1>

      <div className="grid gap-4 md:grid-cols-[15rem_1fr]">
        <AccountSidebar tab={tab} setTab={setTab} />
        <AccountTabContent tab={tab} me={me} setMe={setMe} />
      </div>
    </div>
  );
}
