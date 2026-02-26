// src/features/integrations/jira/ui/JiraBatchContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { JiraIssue } from "@/features/integrations/jira/types";
import { batchListJiraIssues } from "@/features/integrations/jira/api";

type JiraBatchData = Record<number, JiraIssue[]>;

interface JiraBatchContextValue {
  data: JiraBatchData;
  loading: boolean;
  error: string | null;
  loadBatch: (groupId: number, testCaseIds: number[]) => Promise<void>;
  getIssues: (testCaseId: number) => JiraIssue[] | null;
}

const JiraBatchContext = createContext<JiraBatchContextValue | null>(null);

export function JiraBatchProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<JiraBatchData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatch = useCallback(async (groupId: number, testCaseIds: number[]) => {
    if (testCaseIds.length === 0) {
      setData({});
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const result = await batchListJiraIssues(groupId, testCaseIds);
      setData(result);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setError("no-connection");
      } else {
        setError("failed");
      }
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  const getIssues = useCallback((testCaseId: number): JiraIssue[] | null => {
    return data[testCaseId] ?? null;
  }, [data]);

  return (
    <JiraBatchContext.Provider value={{ data, loading, error, loadBatch, getIssues }}>
      {children}
    </JiraBatchContext.Provider>
  );
}

export function useJiraBatch() {
  const context = useContext(JiraBatchContext);
  if (!context) {
    throw new Error("useJiraBatch must be used within JiraBatchProvider");
  }
  return context;
}

