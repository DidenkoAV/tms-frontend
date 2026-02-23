import { NavLink } from "react-router-dom";

function IconFolder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" {...props}>
      <path
        d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function ProjectsLink() {
  return (
    <NavLink to="/projects">
      {({ isActive }) => (
        <span
          className={[
            "group inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm leading-none",
            "transition-all duration-150 focus:outline-none focus-visible:ring-2",
            "bg-white/90 text-slate-900 border-slate-300 hover:-translate-y-0.5 hover:bg-white hover:border-slate-400 hover:shadow-sm",
            "dark:bg-[#0b1222]/80 dark:text-white dark:border-slate-700/60 dark:hover:bg-[#0e1a2c] dark:hover:border-slate-500",
            isActive ? "ring-1 ring-slate-300 dark:ring-slate-600 shadow-inner" : "",
          ].join(" ")}
        >
          <IconFolder width={16} height={16} />
          <span className="font-medium">Projects</span>
        </span>
      )}
    </NavLink>
  );
}

