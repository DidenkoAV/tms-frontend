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

// Add response interceptor to handle 401 errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
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
        "/invite/accept"
      ];
      if (!publicPaths.includes(currentPath)) {
        setAuthToken(null);
        window.location.replace("/");
      }
    }
    return Promise.reject(error);
  }
);
