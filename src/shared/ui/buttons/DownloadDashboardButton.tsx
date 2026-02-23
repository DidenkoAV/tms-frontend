// src/shared/ui/buttons/DownloadDashboardButton.tsx
import { Download } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { useState } from "react";
import InlineAlert from "@/shared/ui/feedback/InlineAlert";

interface Props {
  targetId: string;
  filename?: string;
  label?: string;
}

function resolveBackgroundColor(target: HTMLElement): string {
  const isTransparent = (value: string | null | undefined) => {
    if (!value) return true;
    const c = value.trim().toLowerCase();
    if (c === "" || c === "transparent" || c === "inherit") return true;
    if (c.startsWith("rgba")) {
      const alpha = parseFloat(c.replace(/^rgba\((.+)\)$/i, "$1").split(",").pop()?.trim() ?? "1");
      return alpha === 0;
    }
    if (c.startsWith("hsla")) {
      const alpha = parseFloat(c.replace(/^hsla\((.+)\)$/i, "$1").split(",").pop()?.trim() ?? "1");
      return alpha === 0;
    }
    if (c.startsWith("#") && c.length === 9 && c.endsWith("00")) return true;
    return false;
  };

  let el: HTMLElement | null = target;
  while (el) {
    const bg = window.getComputedStyle(el).backgroundColor;
    if (!isTransparent(bg)) return bg;
    el = el.parentElement;
  }

  const bodyBg = window.getComputedStyle(document.body).backgroundColor;
  if (!isTransparent(bodyBg)) return bodyBg;
  return "#ffffff";
}

export default function DownloadDashboardButton({
  targetId,
  filename = "dashboard.png",
  label = "Export",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleDownload = async () => {
    const el = document.getElementById(targetId);
    if (!el || loading) return;
    setLoading(true);
    setShowSuccess(false);
    setShowError(false);

    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

      const backgroundColor = resolveBackgroundColor(el);

      const dataUrl = await htmlToImage.toPng(el, {
        pixelRatio: 2,
        backgroundColor,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset && node.dataset.exportControl === "true") {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("❌ Failed to export dashboard:", err);
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        title="Download dashboard as PNG"
        data-export-control="true"
        className={`
          group relative inline-flex items-center gap-1.5
          px-3 py-1.5 text-xs font-medium
          transition-all duration-200 ease-out
          rounded-lg
          border border-slate-200/60
          bg-white/70 backdrop-blur-sm
          text-slate-600
          shadow-xs hover:shadow-sm
          hover:border-slate-300
          hover:bg-white
          hover:text-slate-700
          active:scale-95
          disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
          dark:border-slate-600/40
          dark:bg-slate-800/50
          dark:text-slate-400
          dark:hover:border-slate-500
          dark:hover:bg-slate-700
          dark:hover:text-slate-300
          overflow-hidden
        `}
      >
        {/* Animated background */}
        <div className="absolute inset-0 transition-all duration-300 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:opacity-100 group-hover:translate-x-full dark:via-slate-600/20" />
        
        {/* Icon */}
        <Download className={`
          w-3.5 h-3.5 transition-all duration-200
          ${loading 
            ? "animate-pulse text-slate-400" 
            : "group-hover:scale-105 group-hover:text-slate-700 dark:group-hover:text-slate-200"
          }
        `} />
        
        {/* Text */}
        <span className="relative transition-colors duration-200">
          {loading ? "..." : label}
        </span>
      </button>

      {/* Notifications */}
      {showSuccess && (
        <div className="absolute right-0 z-10 mt-2 top-full animate-in fade-in slide-in-from-top-2">
          <InlineAlert variant="success" withIcon={false} className="px-2 py-1 text-xs shadow-md">
            Exported
          </InlineAlert>
        </div>
      )}
      {showError && (
        <div className="absolute right-0 z-10 mt-2 top-full animate-in fade-in slide-in-from-top-2">
          <InlineAlert variant="error" withIcon={false} className="px-2 py-1 text-xs shadow-md">
            Failed
          </InlineAlert>
        </div>
      )}
    </div>
  );
}

// Ultra-compact version
export function MinimalDownloadButton({ 
  targetId, 
  filename = "dashboard.png" 
}: { 
  targetId: string; 
  filename?: string; 
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const el = document.getElementById(targetId);
    if (!el || loading) return;
    setLoading(true);

    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

      const backgroundColor = resolveBackgroundColor(el);

      const dataUrl = await htmlToImage.toPng(el, {
        pixelRatio: 2,
        backgroundColor,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset && node.dataset.exportControl === "true") {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      data-export-control="true"
      className={`
        group p-1.5 rounded-lg
        transition-all duration-200
        border border-slate-200/40
        bg-white/40 backdrop-blur-sm
        text-slate-500
        hover:bg-white
        hover:border-slate-300
        hover:text-slate-700
        hover:shadow-xs
        active:scale-95
        disabled:opacity-30
        dark:border-slate-600/30
        dark:bg-slate-800/30
        dark:text-slate-500
        dark:hover:bg-slate-700
        dark:hover:border-slate-500
        dark:hover:text-slate-300
      `}
      title="Export as PNG"
    >
      <Download className={`
        w-3.5 h-3.5 transition-transform duration-200
        ${loading ? "animate-pulse" : "group-hover:scale-105"}
      `} />
    </button>
  );
}

// Micro version (smallest)
export function MicroDownloadButton({ 
  targetId, 
  filename = "dashboard.png" 
}: { 
  targetId: string; 
  filename?: string; 
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const el = document.getElementById(targetId);
    if (!el || loading) return;
    setLoading(true);

    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

      const backgroundColor = resolveBackgroundColor(el);

      const dataUrl = await htmlToImage.toPng(el, {
        pixelRatio: 2,
        backgroundColor,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset && node.dataset.exportControl === "true") {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      data-export-control="true"
      className={`
        p-1 rounded-md
        transition-all duration-150
        border border-slate-200/30
        bg-white/30
        text-slate-400
        hover:bg-white
        hover:border-slate-300
        hover:text-slate-600
        active:scale-90
        disabled:opacity-20
        dark:border-slate-600/20
        dark:bg-slate-800/20
        dark:text-slate-500
        dark:hover:bg-slate-700
        dark:hover:border-slate-500
        dark:hover:text-slate-300
      `}
      title="Export as PNG"
    >
      <Download className={`w-3 h-3 ${loading ? "animate-pulse" : ""}`} />
    </button>
  );
}
