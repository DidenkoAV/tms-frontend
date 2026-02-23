// Application entry point
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/config/router";

// Global styles
import "../styles/theme.css";
import "../index.css";

// Theme initialization
import { initTheme, getTheme } from "@/lib/theme";

// Apply theme as early as possible (default: dark)
initTheme();

// Sync theme changes across tabs
window.addEventListener("storage", (e) => {
  if (e.key === "theme") {
    initTheme();
    window.dispatchEvent(new CustomEvent("themechange", { detail: getTheme() }));
  }
});

// Render application
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
