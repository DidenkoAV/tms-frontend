// src/features/jira/components/JiraIssuesInline.tsx
import { ExternalLinkIcon } from "lucide-react";
import { useJiraIssues } from "@/features/integrations/jira/ui/hooks/useJiraIssues";

interface Props {
  groupId: number;
  testCaseId: number;
}

export default function JiraIssuesInline({ groupId, testCaseId }: Props) {
  // Soft mode: show all tickets, even without summary/status
  const { issues, loading, error } = useJiraIssues(groupId, testCaseId);

  if (loading) {
    return <span className="text-xs text-slate-400">Loading…</span>;
  }

  if (error === "no-connection") {
    return <span className="text-xs text-amber-500">Jira not connected</span>;
  }

  if (error) {
    return <span className="text-xs text-rose-500">Failed to load</span>;
  }

  if (issues.length === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {issues.map((iss) => (
        <a
          key={iss.id}
          href={iss.issueUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {iss.issueKey}
          <ExternalLinkIcon className="w-3 h-3" />
        </a>
      ))}
    </div>
  );
}
