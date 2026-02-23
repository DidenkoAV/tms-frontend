export type Theme = "light" | "dark";

const THEME_KEY = "theme";

export const getTheme = (): Theme => {
  const raw = localStorage.getItem(THEME_KEY) as Theme | null;
  // Default: DARK
  return raw === "light" || raw === "dark" ? raw : "dark";
};

export const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark"); // Tailwind .dark
  root.setAttribute("data-theme", t);          // For color-scheme/custom variables
};

export const setTheme = (t: Theme) => {
  localStorage.setItem(THEME_KEY, t);
  applyTheme(t);
  window.dispatchEvent(new CustomEvent("themechange", { detail: t }));
};

export const initTheme = () => {
  applyTheme(getTheme());
};
