import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { TabKey } from "@/entities/group";

export function useAccountTabs(defaultTab: TabKey = "profile") {
  const [search, setSearch] = useSearchParams();
  const initialTab = (search.get("tab") as TabKey) || defaultTab;
  const [tab, setTab] = useState<TabKey>(initialTab);
  
  useEffect(() => {
    setSearch({ tab }, { replace: true });
  }, [tab, setSearch]);

  return { tab, setTab };
}

