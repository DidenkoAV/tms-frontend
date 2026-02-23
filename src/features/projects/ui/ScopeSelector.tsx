import * as React from "react";
import type { ProjectListItem } from "@/entities/project";

type Scope = { mode: "project"; projectId: number } | { mode: "all" };

export function ScopeSelector({
  projects,
  scope,
  onChange,
}: {
  projects: ProjectListItem[];
  scope: Scope;
  onChange: (s: Scope) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">Scope:</span>
      <select
        value={scope.mode === "all" ? "all" : String(scope.projectId)}
        onChange={(e) => {
          const v =
            e.target.value === "all"
              ? ({ mode: "all" } as const)
              : ({ mode: "project" as const, projectId: Number(e.target.value) });
          onChange(v);
        }}
        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <option value="all">All projects</option>
        {[...projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.groupName}
          </option>
        ))}
      </select>
    </div>
  );
}
