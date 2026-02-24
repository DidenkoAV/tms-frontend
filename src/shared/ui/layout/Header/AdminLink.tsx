import { NavLink } from "react-router-dom";
import { Shield } from "lucide-react";

export function AdminLink() {
  return (
    <NavLink
      to="/admin"
      className={({ isActive }) =>
        [
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
          isActive
            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        ].join(" ")
      }
    >
      <Shield className="h-3.5 w-3.5" />
      Admin
    </NavLink>
  );
}

