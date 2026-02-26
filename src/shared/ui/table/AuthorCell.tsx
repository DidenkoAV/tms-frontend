import * as React from "react";

export default function AuthorCell({
  name,
  email,
  userId,
}: {
  name?: string | null;
  email?: string | null;
  userId?: number | null;
}) {
  // Compact display: only name (no email, no avatar)
  const display =
    (name && name.trim()) ||
    (email && email.split('@')[0]?.trim()) ||
    (userId ? `User #${userId}` : "—");

  return (
    <div className="truncate text-[13px] text-slate-700 dark:text-slate-300">
      {display}
    </div>
  );
}
