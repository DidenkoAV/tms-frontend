import type { TestCase } from "@/entities/test-case";
import { CaseRow, type CaseRowProps } from "@/features/test-cases";
import type { AssigneeOption } from "./AssigneeSelect";

type ColKey = "priority" | "type" | "automation" | "author" | "assigned" | "jira";

export type CaseRowsListProps = {
  cases: TestCase[];
  cols: Record<ColKey, boolean>;
  gridTemplate: string;
  selectedCases: Set<number>;
  onToggleCase: (id: number, checked: boolean) => void;
  onOpenCase: (id: number) => void;
  onStartEditCase: (testCase: TestCase) => void;
  onCancelEditCase: () => void;
  onSaveCaseTitle: (id: number) => void;
  onDeleteCase: (id: number) => void;
  onPatchCase: CaseRowProps["onPatchCase"];
  editingCaseId: number | null;
  draftCaseTitle: string;
  setDraftCaseTitle: (s: string) => void;
  projectId: number;
  dataVersion: number; // Used to force remount when data is reloaded
  groupMembers: AssigneeOption[];
};

export default function CaseRowsList({
  cases,
  cols,
  gridTemplate,
  selectedCases,
  onToggleCase,
  onOpenCase,
  onStartEditCase,
  onCancelEditCase,
  onSaveCaseTitle,
  onDeleteCase,
  onPatchCase,
  editingCaseId,
  draftCaseTitle,
  setDraftCaseTitle,
  projectId,
  dataVersion,
  groupMembers,
}: CaseRowsListProps) {
  return (
    <>
      {cases.map((testCase) => (
        <CaseRow
          key={`${testCase.id}-${dataVersion}`}
          c={testCase}
          cols={cols}
          onOpen={() => onOpenCase(testCase.id)}
          onStartEdit={() => onStartEditCase(testCase)}
          onCancelEdit={onCancelEditCase}
          onSaveEdit={() => onSaveCaseTitle(testCase.id)}
          onDelete={() => onDeleteCase(testCase.id)}
          onPatchCase={onPatchCase}
          gridCols={gridTemplate}
          checked={selectedCases.has(testCase.id)}
          onCheck={(v) => onToggleCase(testCase.id, v)}
          isEditing={editingCaseId === testCase.id}
          draftCaseTitle={draftCaseTitle}
          setDraftCaseTitle={setDraftCaseTitle}
          projectId={projectId}
          dataVersion={dataVersion}
          groupMembers={groupMembers}
        />
      ))}
    </>
  );
}
