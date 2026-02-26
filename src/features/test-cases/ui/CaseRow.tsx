import { useRef, useState } from "react";
import type { TestCase } from "@/entities/test-case";
import { TFCheckbox, TableRowActions } from "@/shared/ui/table";
import { FileIcon, EditIcon, TrashIcon, OpenIcon } from "@/shared/ui/icons";
import DropdownPortal, { MenuItem } from "./DropdownPortal";
import InlineEditCell from "@/shared/ui/table/InlineEditCell";
import AuthorCell from "@/shared/ui/table/AuthorCell";
import AssigneeSelect, { type AssigneeOption } from "./AssigneeSelect";
import { JiraIssuesInline } from "@/features/integrations/jira";
import {
  CaseAutomationBadge,
  CasePriorityBadge,
  CaseTypeBadge,
  automationLabelFromStatus,
  priorityLabelFromId,
  typeLabelFromId,
  type CaseAutomationLabel,
  type CasePriorityLabel,
  type CaseTypeLabel,
} from "@/shared/ui/table/CaseBadges";

/* mapping + helpers */
export type CaseRowProps = {
  c: TestCase;
  cols: Record<"priority" | "type" | "automation" | "author" | "assigned" | "jira", boolean>;
  gridCols: string;

  onOpen: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;

  isEditing: boolean;
  draftCaseTitle: string;
  setDraftCaseTitle: (s: string) => void;

  onDelete: () => void;
  onPatchCase: (
    id: number,
    patch: Partial<
      Pick<TestCase, "priorityId" | "typeId" | "automationStatus" | "title" | "assignedTo">
    >
  ) => void | Promise<void>;

  checked: boolean;
  onCheck: (v: boolean) => void;
  projectId: number;
  dataVersion?: number;
  groupMembers: AssigneeOption[];
};

export default function CaseRow({
  c,
  cols,
  onOpen,
  isEditing,
  draftCaseTitle,
  setDraftCaseTitle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onPatchCase,
  gridCols,
  checked,
  onCheck,
  projectId,
  dataVersion,
  groupMembers,
}: CaseRowProps) {
  const priority: CasePriorityLabel = priorityLabelFromId(c.priorityId);
  const type: CaseTypeLabel = typeLabelFromId(c.typeId);
  const auto: CaseAutomationLabel = automationLabelFromStatus(
    c.automationStatus
  );

  const priRef = useRef<HTMLButtonElement | null>(null);
  const typeRef = useRef<HTMLButtonElement | null>(null);
  const autoRef = useRef<HTMLButtonElement | null>(null);
  const [openPri, setOpenPri] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openAuto, setOpenAuto] = useState(false);

  const rowHighlight = checked ? "bg-emerald-50/80 dark:bg-white/10" : "";
  const handleCheck = (v: any) =>
    onCheck(typeof v === "boolean" ? v : !checked);

  return (
    <li
      className={[
        "px-3 py-2 rounded-xl transition-colors cursor-pointer",
        rowHighlight || "hover:bg-slate-50 dark:hover:bg-slate-900/50",
      ].join(" ")}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(c.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpen()}
      title="Click to open case"
    >
      <div className="grid gap-2" style={{ gridTemplateColumns: gridCols }}>
        {/* TITLE */}
        <div className="flex items-center min-w-0 gap-2">
          <TFCheckbox
            checked={checked}
            onChange={handleCheck}
            title={checked ? "Unselect" : "Select"}
            size={18}
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className="select-none cursor-grab text-slate-400 dark:text-slate-500"
            title="Drag to move"
            onClick={(e) => e.stopPropagation()}
          >
            ⋮⋮
          </span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            <FileIcon />
          </span>

          <InlineEditCell
            id={c.id}
            value={c.title || `Case #${c.id}`}
            isEditing={isEditing}
            draft={draftCaseTitle}
            setDraft={setDraftCaseTitle}
            onSave={() => onSaveEdit()}
            onCancel={onCancelEdit}
            fontSize="text-[15px]"
            onViewClick={() => onStartEdit()}
            viewClassName="hover:underline"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* BADGES */}
        {cols.priority && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <CasePriorityBadge
              ref={priRef}
              onClick={() => setOpenPri((v) => !v)}
              priority={priority}
              interactive
              showCaret
              title="Change priority"
            />
            <DropdownPortal
              open={openPri}
              anchor={priRef.current}
              onClose={() => setOpenPri(false)}
              width={220}
            >
              {[
                { id: 4, label: "Critical" },
                { id: 3, label: "High" },
                { id: 2, label: "Medium" },
                { id: 1, label: "Low" },
              ].map((opt) => (
                <MenuItem
                  key={opt.id}
                  active={c.priorityId === opt.id}
                  label={opt.label}
                  onClick={() => {
                    setOpenPri(false);
                    onPatchCase(c.id, { priorityId: opt.id });
                  }}
                />
              ))}
            </DropdownPortal>
          </div>
        )}

        {cols.type && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <CaseTypeBadge
              ref={typeRef}
              onClick={() => setOpenType((v) => !v)}
              type={type}
              interactive
              showCaret
              title="Change type"
            />
            <DropdownPortal
              open={openType}
              anchor={typeRef.current}
              onClose={() => setOpenType(false)}
              width={240}
            >
              {[
                { id: 1, label: "Functional" },
                { id: 2, label: "Regression" },
                { id: 3, label: "Smoke" },
                { id: 4, label: "Security" },
                { id: 5, label: "Performance" },
                { id: 6, label: "Other" },
              ].map((opt) => (
                <MenuItem
                  key={opt.id}
                  active={c.typeId === opt.id}
                  label={opt.label}
                  onClick={() => {
                    setOpenType(false);
                    onPatchCase(c.id, { typeId: opt.id });
                  }}
                />
              ))}
            </DropdownPortal>
          </div>
        )}

        {cols.automation && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <CaseAutomationBadge
              ref={autoRef}
              onClick={() => setOpenAuto((v) => !v)}
              automation={auto}
              interactive
              showCaret
              title="Change automation"
            />
            <DropdownPortal
              open={openAuto}
              anchor={autoRef.current}
              onClose={() => setOpenAuto(false)}
              width={220}
            >
              {[
                { key: "AUTOMATED", label: "Automated" },
                { key: "IN_PROGRESS", label: "WIP" },
                { key: "NOT_AUTOMATED", label: "Manual" },
              ].map((opt) => (
                <MenuItem
                  key={opt.key}
                  active={c.automationStatus === opt.key}
                  label={opt.label}
                  onClick={() => {
                    setOpenAuto(false);
                    onPatchCase(c.id, {
                      automationStatus: opt.key as any,
                    });
                  }}
                />
              ))}
            </DropdownPortal>
          </div>
        )}

        {/* AUTHOR */}
        {cols.author && (
          <div className="flex items-center">
            <AuthorCell
              name={c.createdByName || null}
              email={c.createdByEmail || null}
              userId={c.createdBy ?? undefined}
            />
          </div>
        )}

        {/* ASSIGNED */}
        {cols.assigned && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <AssigneeSelect
              value={c.assignedTo ?? null}
              onChange={(userId) => onPatchCase(c.id, { assignedTo: userId })}
              options={groupMembers}
            />
          </div>
        )}

        {/* JIRA */}
        {cols.jira && (
          <div className="flex items-center">
            <JiraIssuesInline testCaseId={c.id} />
          </div>
        )}

        {/* ACTIONS */}
        <div onClick={(e) => e.stopPropagation()}>
          <TableRowActions
            className="[&>button]:rounded-full"
            actions={[
            {
              key: "open",
              title: "Open",
              variant: "ghost",
              size: "sm",
              icon: <OpenIcon />,
              onClick: onOpen,
            },
            {
              key: "rename",
              title: "Rename",
              size: "sm",
              icon: <EditIcon />,
              hidden: isEditing,
              onClick: onStartEdit,
            },
            {
              key: "delete",
              title: "Delete",
              variant: "danger",
              size: "sm",
              icon: <TrashIcon />,
              onClick: onDelete,
            },
          ]}
          />
        </div>
      </div>
    </li>
  );
}
