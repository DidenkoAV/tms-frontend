import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import type { Me } from "@/entities/group";

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await http.get<Me>("/api/auth/me");
        if (alive) setMe(data);
      } catch (e: any) {
        if (alive) setError(e?.response?.data?.message || "Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { me, setMe, loading, error };
}
