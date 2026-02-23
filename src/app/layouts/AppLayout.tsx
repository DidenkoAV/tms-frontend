// Main application layout
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { http, setAuthToken } from "@/lib/http";
import { getTheme, setTheme as setAppTheme } from "@/lib/theme";

// Layout components
import { Logo, ThemeToggle, ProjectsLink, UserMenu } from "@/shared/ui/layout/Header";

import type { AppOutletCtx } from "@/app/types";
import { isPublicRoute } from "@/app/config/constants";

/* ======================= App layout ======================= */
export default function App() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const showHeader = useMemo(() => !isPublicRoute(pathname), [pathname]);

  type AuthStatus = "loading" | "guest" | "user";
  const [me, setMe] = useState<{ fullName?: string | null; email?: string | null } | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const bootOnce = useRef(false);
  const themeOverrideRef = useRef<{ prev: "light" | "dark" } | null>(null);

  // Force light theme on public pages
  useEffect(() => {
    const current = getTheme();
    const isPublic = isPublicRoute(pathname);

    if (isPublic) {
      if (!themeOverrideRef.current) {
        themeOverrideRef.current = { prev: current };
      }
      if (current !== "light") {
        setAppTheme("light");
      }
    } else {
      if (themeOverrideRef.current) {
        const prev = themeOverrideRef.current.prev;
        themeOverrideRef.current = null;
        if (current !== prev) {
          setAppTheme(prev);
        }
      }
    }
  }, [pathname]);

  const loadMe = useCallback(async () => {
    try {
      const r = await http.get("/api/auth/me");
      setMe({ fullName: r.data.fullName, email: r.data.email });
      setStatus("user");
    } catch (err) {
      // Silent fail - user is not authenticated
      setMe(null);
      setStatus("guest");

      // Log error in development for debugging
      if (import.meta.env.DEV) {
        console.warn("[App] Failed to load user session:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (bootOnce.current) return;
    bootOnce.current = true;

    if (isPublicRoute(pathname)) {
      setStatus("guest");
    } else {
      loadMe();
    }
  }, [loadMe, pathname]);

  useEffect(() => {
    const onFocus = () => {
      if (status !== "loading") loadMe();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && status !== "loading") loadMe();
    };
    const onStorageChange = (e: StorageEvent) => {
      // Reload user state when token changes in localStorage
      if (e.key === "token") {
        if (e.newValue) {
          // Token was added or changed - reload user
          loadMe();
        } else {
          // Token was removed - set to guest
          setMe(null);
          setStatus("guest");
        }
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorageChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [loadMe, status]);

  const onLogout = useCallback(async () => {
    // Clear auth token first
    setAuthToken(null);

    // Clear local state
    setMe(null);
    setStatus("guest");

    try {
      await http.post("/api/auth/logout");
    } catch (err) {
      // Log error but continue with logout
      if (import.meta.env.DEV) {
        console.warn("[App] Logout request failed:", err);
      }
    }

    // Force full page reload to ensure clean state
    window.location.replace("/");
  }, []);

  const authed = status === "user";

  const goProfile = useCallback(() => nav("/account"), [nav]);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0b0f1a] dark:text-slate-100">
      {showHeader && (
        <header className="relative z-50 isolate border-b bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-[#0b0f1a]/95">
          <div className="flex items-center max-w-6xl gap-4 px-4 py-3 mx-auto">
            <NavLink
              to={authed ? "/dashboard" : "/"}
              className="flex items-center gap-2"
              aria-label="Home"
            >
              <Logo size={28} withWordmark />
            </NavLink>

            <nav className="flex items-center gap-3 ml-auto">
              {authed && <ProjectsLink />}
              {authed && (
                <UserMenu
                  fullName={me?.fullName}
                  email={me?.email}
                  onProfile={goProfile}
                  onLogout={onLogout}
                />
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>
      )}

      <main>
        {status === "loading" && !isPublicRoute(pathname) ? (
          <div className="grid min-h-[40vh] place-items-center text-slate-500">
            Checking session…
          </div>
        ) : (
          <Outlet context={{ authed, me, onLogout } satisfies AppOutletCtx} />
        )}
      </main>
    </div>
  );
}
