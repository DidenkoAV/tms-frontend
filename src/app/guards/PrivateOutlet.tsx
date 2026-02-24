// Route guard for authenticated routes
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import type { AppOutletCtx } from "@/app/types";

export default function PrivateOutlet() {
  const context = useOutletContext<AppOutletCtx>();
  const loc = useLocation();
  if (!context.authed) return <Navigate to="/" replace state={{ from: loc }} />;
  // Pass context down to child routes
  return <Outlet context={context} />;
}
