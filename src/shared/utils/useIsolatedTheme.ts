import { useEffect } from "react";


export function useIsolatedTheme(options: { forceLight?: boolean } = {}) {
  const { forceLight = true } = options;

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prev = {
      htmlClass: html.className,
      bodyClass: body.className,
      htmlDataTheme: html.getAttribute("data-theme"),
      bodyDataTheme: body.getAttribute("data-theme"),
    };

    const stripThemeClasses = (el: HTMLElement) => {
      const cls = new Set(el.className.split(/\s+/).filter(Boolean));
      for (const c of Array.from(cls)) {
        if (c === "dark" || /^theme-/.test(c)) cls.delete(c);
      }
      el.className = Array.from(cls).join(" ");
    };

    stripThemeClasses(html);
    stripThemeClasses(body);
    html.removeAttribute("data-theme");
    body.removeAttribute("data-theme");

    let addedLight = false;
    if (forceLight) {
      body.classList.add("bg-white", "text-slate-900");
      addedLight = true;
    }

    return () => {
      html.className = prev.htmlClass;
      body.className = prev.bodyClass;
      if (prev.htmlDataTheme) html.setAttribute("data-theme", prev.htmlDataTheme);
      if (prev.bodyDataTheme) body.setAttribute("data-theme", prev.bodyDataTheme);

      if (forceLight && addedLight) {
        body.classList.remove("bg-white", "text-slate-900");
      }
    };
  }, [forceLight]);
}
