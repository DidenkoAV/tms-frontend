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

  // 3) Prod / any other environment - hit same domain, nginx proxies /api → backend
  return "/api";
}

const API_BASE_URL = resolveApiBase();

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // important for HttpOnly cookie
});

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

// On page load, pull token from localStorage (for classic login)
applyAuthHeader(localStorage.getItem("token"));

// Store CSRF token in memory
let csrfToken: string | null = null;

// Helper function to get CSRF token from cookie
function getCsrfToken(): string | null {
  // First, try to get from memory
  if (csrfToken) {
    return csrfToken;
  }

  // Then try to read from cookie
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  if (parts.length === 2) {
    const token = decodeURIComponent(parts.pop()?.split(';').shift() || '');
    if (token) {
      csrfToken = token; // Cache it
      return token;
    }
  }
  return null;
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
    const csrfToken = getCsrfToken();

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('[HTTP] Request:', config.method?.toUpperCase(), config.url);
      console.log('[HTTP] CSRF Token from cookie:', csrfToken);
      console.log('[HTTP] All cookies:', document.cookie);
    }

    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
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
      if (import.meta.env.DEV) {
        console.log('[HTTP] CSRF token from response header:', headerToken);
      }
      return response;
    }

    // 2. From Set-Cookie header (fallback, may not work in browser due to security)
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const token = extractCsrfFromSetCookie(Array.isArray(setCookie) ? setCookie[0] : setCookie);
      if (token) {
        csrfToken = token;
        if (import.meta.env.DEV) {
          console.log('[HTTP] CSRF token extracted from Set-Cookie:', token);
        }
      }
    }

    // 3. Try to read from cookie after browser processes Set-Cookie
    setTimeout(() => {
      const cookieToken = getCsrfToken();
      if (cookieToken && cookieToken !== csrfToken) {
        csrfToken = cookieToken;
        if (import.meta.env.DEV) {
          console.log('[HTTP] CSRF token updated from cookie:', cookieToken);
        }
      }
    }, 0);

    return response;
  },
  (error) => {
    // Extract CSRF token from error responses too
    if (error.response?.headers?.['x-xsrf-token']) {
      const headerToken = error.response.headers['x-xsrf-token'];
      csrfToken = headerToken;
      if (import.meta.env.DEV) {
        console.log('[HTTP] CSRF token from error response header:', headerToken);
      }
    } else if (error.response?.headers?.['set-cookie']) {
      const setCookie = error.response.headers['set-cookie'];
      const token = extractCsrfFromSetCookie(Array.isArray(setCookie) ? setCookie[0] : setCookie);
      if (token) {
        csrfToken = token;
        if (import.meta.env.DEV) {
          console.log('[HTTP] CSRF token from error Set-Cookie:', token);
        }
      }
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
      console.warn('[HTTP] Rate limit exceeded:', error.response?.data?.message);
      // You can add a toast notification here if you have a notification system
    }

    return Promise.reject(error);
  }
);
