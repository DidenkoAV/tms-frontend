import * as React from "react";

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0f1524] ${className}`}
  >
    {children}
  </section>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800/60 ${className}`} />
);
