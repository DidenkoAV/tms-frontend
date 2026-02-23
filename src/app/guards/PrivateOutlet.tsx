// Route guard for authenticated routes
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import type { AppOutletCtx } from "@/app/types";

export default function PrivateOutlet() {
  const { authed } = useOutletContext<AppOutletCtx>();
  const loc = useLocation();
  if (!authed) return <Navigate to="/" replace state={{ from: loc }} />;
  return <Outlet />;
}
