import { useState, useEffect } from "react";
import { getTheme, setTheme as setAppTheme } from "@/lib/theme";

function IconSunNice(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" {...props}>
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity=".12" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
        <path d="M5.6 5.6l2 2" />
        <path d="M16.4 16.4l2 2" />
        <path d="M16.4 7.6l2-2" />
        <path d="M5.6 18.4l2-2" />
      </g>
    </svg>
  );
}

function IconMoon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" {...props}>
      <path d="M21 12.8A9 9 0 1111.2 3a7.2 7.2 0 009.8 9.8z" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme());
  
  useEffect(() => {
    const onChange = () => setTheme(getTheme());
    window.addEventListener("themechange", onChange as EventListener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme") onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("themechange", onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isDark = theme === "dark";
  const toggle = () => setAppTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light" : "Switch to dark"}
      className={[
        "inline-grid h-9 w-9 place-items-center rounded-xl border transition",
        "bg-white/90 text-slate-900 border-slate-300 hover:bg-white hover:border-slate-400",
        "dark:bg-[#0b1222]/70 dark:text-slate-100 dark:border-slate-700/60 dark:hover:border-slate-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/25 dark:focus-visible:ring-slate-600/25",
      ].join(" ")}
    >
      {isDark ? <IconSunNice width={16} height={16} /> : <IconMoon width={16} height={16} />}
    </button>
  );
}

