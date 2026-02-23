// App-level constants

/**
 * Routes that don't require authentication
 */
export const PUBLIC_ROUTES = ["/", "/register", "/verify", "/reset", "/check-email", "/invite/accept"] as const;

/**
 * Check if a given pathname is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

