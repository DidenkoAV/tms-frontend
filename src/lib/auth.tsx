// src/lib/auth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { http } from "@/lib/http";
import { Navigate, useLocation } from "react-router-dom";

type Me = {
  id: number;
  email: string;
  fullName: string | null;
  enabled: boolean;
  roles: string[];
  createdAt: string;
};

type AuthState =
  | { status: "loading"; me: null }
  | { status: "signedOut"; me: null }
  | { status: "signedIn"; me: Me };

const AuthCtx = createContext<AuthState>({ status: "loading", me: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", me: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await http.get<Me>("/api/auth/me", { withCredentials: true });
        if (!cancelled) setState({ status: "signedIn", me: data });
      } catch {
        if (!cancelled) setState({ status: "signedOut", me: null });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

// Protect a route: renders children if signed in, otherwise redirects to /login
export function RequireAuth({ children }: { children: React.ReactElement }) {
  const auth = useAuth();
  const location = useLocation();

  // if (auth.status === "loading") {
  //   return (
  //     <div className="grid min-h-[40vh] place-items-center text-slate-600">
  //       Checking session…
  //     </div>
  //   );
  // }

  if (auth.status === "signedOut") {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

// New: Public route that doesn't show loading indicator
export function PublicRoute({ children }: { children: React.ReactElement }) {
  const auth = useAuth();
  
  // For public routes, we don't care about auth status, just render children
  return children;
}