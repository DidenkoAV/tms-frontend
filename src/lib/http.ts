// src/lib/http.ts
import axios from "axios";

function resolveApiBase() {
  // 1) If explicitly set by environment - use it (both locally and in prod)
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envBase && envBase.trim().length > 0) {
    return envBase.replace(/\/+$/, ""); // remove trailing /
  }

  // 2) Local development - Vite on 5173, backend on 8083
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8083";
  }

  // 3) Prod / any other environment - use same origin.
  // API calls already include "/api/..." prefix in request paths.
  return "";
}

const API_BASE_URL = resolveApiBase();

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // important for HttpOnly cookie
});

type RetryableConfig = {
  _csrfRetried?: boolean;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
};

function applyAuthHeader(token: string | null) {
  if (token) {
    http.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete http.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
}

export function setAuthToken(token: string | null) {
  applyAuthHeader(token);
}

export async function ensureCsrfToken(): Promise<void> {
  // Public endpoint that forces CSRF token initialization on backend.
  await http.get("/api/auth/csrf", { withCredentials: true });
}

// On page load, pull token from localStorage (for classic login)
applyAuthHeader(localStorage.getItem("token"));

// Store CSRF token in memory
let csrfToken: string | null = null;

function readCsrfTokenFromCookie(): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  if (parts.length !== 2) return null;
  const token = decodeURIComponent(parts.pop()?.split(";").shift() || "");
  return token || null;
}

// Helper function to get CSRF token.
// Always prefer the latest cookie value to avoid stale in-memory token.
function getCsrfToken(): string | null {
  const cookieToken = readCsrfTokenFromCookie();
  if (cookieToken) {
    csrfToken = cookieToken;
    return cookieToken;
  }
  return csrfToken;
}

// Helper function to extract CSRF token from Set-Cookie header
function extractCsrfFromSetCookie(setCookieHeader: string | undefined): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Add request interceptor to attach CSRF token
http.interceptors.request.use(
  (config) => {
    // Add CSRF token to all requests (GET, POST, PUT, PATCH, DELETE)
    const token = getCsrfToken();

    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 and 429 errors, and extract CSRF token
http.interceptors.response.use(
  (response) => {
    // Try to extract CSRF token from multiple sources:

    // 1. From custom response header (if backend sends it)
    const headerToken = response.headers['x-xsrf-token'];
    if (headerToken) {
      csrfToken = headerToken;
      return response;
    }

    // 2. From Set-Cookie header (fallback, may not work in browser due to security)
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const token = extractCsrfFromSetCookie(Array.isArray(setCookie) ? setCookie[0] : setCookie);
      if (token) {
        csrfToken = token;
      }
    }

    // 3. Try to read from cookie after browser processes Set-Cookie
    setTimeout(() => {
      const cookieToken = getCsrfToken();
      if (cookieToken && cookieToken !== csrfToken) {
        csrfToken = cookieToken;
      }
    }, 0);

    return response;
  },
  (error) => {
    // Extract CSRF token from error responses too
    if (error.response?.headers?.['x-xsrf-token']) {
      const headerToken = error.response.headers['x-xsrf-token'];
      csrfToken = headerToken;
    } else if (error.response?.headers?.['set-cookie']) {
      const setCookie = error.response.headers['set-cookie'];
      const token = extractCsrfFromSetCookie(Array.isArray(setCookie) ? setCookie[0] : setCookie);
      if (token) {
        csrfToken = token;
      }
    }

    // Auto-heal CSRF mismatch for mutating requests:
    // refresh CSRF cookie and retry once.
    const config = (error.config || {}) as RetryableConfig;
    const method = (config.method || "").toLowerCase();
    const isMutating = ["post", "put", "patch", "delete"].includes(method);
    const isCsrfEndpoint = (config.url || "").includes("/api/auth/csrf");
    if (error.response?.status === 403 && isMutating && !config._csrfRetried && !isCsrfEndpoint) {
      config._csrfRetried = true;
      return ensureCsrfToken()
        .then(() => {
          const latestToken = getCsrfToken();
          if (latestToken) {
            config.headers = {
              ...(config.headers || {}),
              "X-XSRF-TOKEN": latestToken,
            };
          }
          return http.request(config as any);
        })
        .catch(() => Promise.reject(error));
    }

    // If we get 401 Unauthorized, clear the token and redirect to login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Only redirect if we're not already on a public page
      const publicPaths = [
        "/",
        "/register",
        "/verify",
        "/check-email",
        "/forgot-password",
        "/reset-password",
        "/confirm-email",
        "/invite/accepted"
      ];
      if (!publicPaths.includes(currentPath)) {
        setAuthToken(null);
        window.location.replace("/");
      }
    }

    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      // You can add a toast notification here if you have a notification system
    }

    return Promise.reject(error);
  }
);
