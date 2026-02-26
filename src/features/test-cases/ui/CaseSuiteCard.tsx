import type { ReactNode } from "react";
import { SuiteCard } from "@/features/test-cases";
import CaseRowsList, { type CaseRowsListProps } from "./CaseRowsList";
import type { TestCase } from "@/entities/test-case";

type ColKey = "priority" | "type" | "automation" | "author";

type RenameControls = {
  showRename: boolean;
  onStartRename: () => void;
  isRenaming: boolean;
  renameName: string;
  setRenameName: (s: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
};

type CaseSuiteCardProps = {
  suiteKey: string;
  title: ReactNode;
  icon: ReactNode;
  description: string;
  open: boolean;
  onToggle: () => void;
  onAddCase: () => void;
  onAddSubsuite?: () => void;
  depth?: number;
  sortDir: "asc" | "desc";
  onToggleSort: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  cols: Record<ColKey, boolean>;
  cases: TestCase[];
  gridTemplate: string;
  suiteSelectable: boolean;
  suiteChecked: boolean;
  suiteIndeterminate: boolean;
  onSuiteCheck: (checked: boolean) => void;
  renameControls?: RenameControls | null;
  hasChildSuites?: boolean;
} & Omit<CaseRowsListProps, "cases" | "cols" | "gridTemplate">;

const noop = () => undefined;

export default function CaseSuiteCard({
  suiteKey,
  title,
  icon,
  description,
  open,
  onToggle,
  onAddCase,
  onAddSubsuite,
  depth,
  sortDir,
  onToggleSort,
  onDragOver,
  onDrop,
  cols,
  cases,
  gridTemplate,
  suiteSelectable,
  suiteChecked,
  suiteIndeterminate,
  onSuiteCheck,
  renameControls,
  hasChildSuites,
  ...caseRowsProps
}: CaseSuiteCardProps) {
  const rename = renameControls ?? null;

  return (
    <SuiteCard
      zoneKey={suiteKey}
      title={title}
      icon={icon}
      description={description}
      open={open}
      onToggle={onToggle}
      onAdd={onAddCase}
      onAddSubsuite={onAddSubsuite}
      depth={depth}
      sortDir={sortDir}
      onToggleSort={onToggleSort}
      onDragOver={onDragOver}
      onDrop={onDrop}
      cols={cols}
      itemsCount={cases.length}
      hasChildSuites={hasChildSuites}
      suiteSelectable={suiteSelectable}
      suiteChecked={suiteChecked}
      suiteIndeterminate={suiteIndeterminate}
      onSuiteCheck={onSuiteCheck}
      showRename={rename?.showRename ?? false}
      onStartRename={rename?.onStartRename ?? noop}
      isRenaming={rename?.isRenaming ?? false}
      renameName={rename?.renameName ?? ""}
      setRenameName={rename?.setRenameName ?? noop}
      onSaveRename={rename?.onSaveRename ?? noop}
      onCancelRename={rename?.onCancelRename ?? noop}
      gridCols={gridTemplate}
    >
      <CaseRowsList
        cases={cases}
        cols={cols}
        gridTemplate={gridTemplate}
        {...caseRowsProps}
      />
    </SuiteCard>
  );
}
