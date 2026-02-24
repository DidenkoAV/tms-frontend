// Route guard for admin routes (ROLE_ADMIN required)
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import type { AppOutletCtx } from "@/app/types";

export default function AdminOutlet() {
  const context = useOutletContext<AppOutletCtx>();
  const loc = useLocation();

  // Debug logging
  console.log("[AdminOutlet] Context:", context);
  console.log("[AdminOutlet] me:", context?.me);
  console.log("[AdminOutlet] roles:", context?.me?.roles);

  // Check if context exists and user has ROLE_ADMIN
  const isAdmin = context?.me?.roles?.includes("ROLE_ADMIN");

  console.log("[AdminOutlet] isAdmin:", isAdmin);

  if (!isAdmin) {
    console.log("[AdminOutlet] Access denied, redirecting to /projects");
    return <Navigate to="/projects" replace state={{ from: loc }} />;
  }

  console.log("[AdminOutlet] Access granted, rendering admin page");

  // Pass context down to child routes
  return <Outlet context={context} />;
}

