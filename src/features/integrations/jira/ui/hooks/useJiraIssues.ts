// src/features/jira/hooks/useJiraIssues.ts
import { useEffect, useState, useCallback } from "react";
import { listJiraIssues } from "@/features/integrations/jira/api";
import type { JiraIssue } from "@/features/integrations/jira/types";

export function useJiraIssues(groupId: number, testCaseId: number) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await listJiraIssues(groupId, testCaseId);
      setIssues(data || []); // Take all as is, without filtering
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setError("no-connection");
      } else {
        setError("failed");
      }
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, testCaseId]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  return { issues, loading, error, reload: loadIssues };
}
