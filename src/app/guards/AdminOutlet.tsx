// Route guard for admin routes (ROLE_ADMIN required)
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import type { AppOutletCtx } from "@/app/types";

export default function AdminOutlet() {
  const context = useOutletContext<AppOutletCtx>();
  const loc = useLocation();

  // Check if context exists and user has ROLE_ADMIN
  const isAdmin = context?.me?.roles?.includes("ROLE_ADMIN");

  if (!isAdmin) {
    return <Navigate to="/projects" replace state={{ from: loc }} />;
  }

  // Pass context down to child routes
  return <Outlet context={context} />;
}

