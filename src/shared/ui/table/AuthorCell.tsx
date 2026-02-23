import * as React from "react";
import { useEffect, useState } from "react";
 

export default function AuthorCell({
  name,
  email,
  userId,
}: {
  name?: string | null;
  email?: string | null;
  userId?: number | null;
}) {
  const display =
    (name && name.trim()) ||
    (email && email.trim()) ||
    (userId ? `#${userId}` : "—");

  const seed = (name || email || (userId != null ? String(userId) : "")) || "U";
  const initials =
    seed
      .split(/[\s.@_]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
        {initials}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-100">
          {display}
        </div>
        {email && (
          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {email}
          </div>
        )}
      </div>
    </div>
  );
}
