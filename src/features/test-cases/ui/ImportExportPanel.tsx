// src/features/cases/components/ImportExportPanelMini.tsx
import { useEffect, useRef, useState } from "react";
import { exportCases, importCases } from "@/entities/test-case";
import { UploadIcon, DownloadIcon, ChevronDownIcon } from "@/shared/ui/icons";
import { useConfirm } from "@/shared/ui/alert/Confirm";

interface Props {
  projectId: number;
  onAlert?: (text: string, kind?: "info" | "error") => void;
  onImported?: () => void;
}

type ExportFmt = "json";

export default function ImportExportPanelMini({ projectId, onAlert, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapExportRef = useRef<HTMLDivElement>(null);
  const wrapImportRef = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState(false);
  const [menuExport, setMenuExport] = useState(false);
  const [menuImport, setMenuImport] = useState(false);
  const confirm = useConfirm();

  const showAlert = (text: string, kind: "info" | "error" = "info") => onAlert?.(text, kind);

  /* ========= EXPORT ========= */
  const doExport = async (format: ExportFmt = "json") => {
    try {
      setBusy(true);
      const blob = await exportCases(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `testcases_project_${projectId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert?.("Export completed successfully");
    } catch (e: any) {
      showAlert?.(e?.response?.data?.message || "Export failed", "error");
    } finally {
      setBusy(false);
      setMenuExport(false);
    }
  };

  /* ========= IMPORT ========= */
  const handleImport = async (file: File, overwrite = false) => {
    try {
      setBusy(true);
      const json = JSON.parse(await file.text());
      const body = {
        cases: Array.isArray(json) ? json : json.cases ?? [],
        suites: json.suites ?? [],
      };
      const res = await importCases(projectId, body, overwrite);
      showAlert?.(
        `Import completed: ${res.imported} imported, ${res.skipped} skipped${
          res.updated ? `, ${res.updated} updated` : ""
        }`
      );
      onImported?.();
    } catch (e: any) {
      showAlert?.(e?.response?.data?.message || "Import failed", "error");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    confirm.open(
      "Do you want to replace existing test cases if they already exist in this project?",
      () => handleImport(file, true),
      { title: "Overwrite existing cases?", okText: "Import (overwrite)", cancelText: "Import (skip)" }
    );
    requestAnimationFrame(() => {
      const cancelBtn = document.querySelector<HTMLButtonElement>("[data-confirm-cancel]");
      cancelBtn?.addEventListener("click", () => handleImport(file, false), { once: true });
    });
  };

  /* ========= MENU UX ========= */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const targets = [wrapExportRef.current, wrapImportRef.current];
      if (!targets.some((r) => r?.contains(e.target as Node))) {
        setMenuExport(false);
        setMenuImport(false);
      }
    };
    const onEsc = (e: KeyboardEvent) =>
      e.key === "Escape" && (setMenuExport(false), setMenuImport(false));
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  /* ========= STYLES ========= */
  const btnBase =
    "inline-flex h-7 items-center gap-1 rounded-xl border px-2.5 text-[12px] font-medium " +
    "transition active:translate-y-px shadow-sm " +
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 " +
    "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";

  const ringExport = menuExport ? "ring-2 ring-slate-300/60 dark:ring-slate-600/60" : "";
  const ringImport = menuImport ? "ring-2 ring-slate-300/60 dark:ring-slate-600/60" : "";

  /* ========= RENDER ========= */
  return (
    <>
      <div className="relative flex items-center gap-1.5">
        {/* Export Split Button */}
        <div ref={wrapExportRef} className="relative">
          <div className="flex">
            <button
              disabled={busy}
              onClick={() => doExport()}
              className={`${btnBase} justify-center rounded-r-none px-2.5 ${ringExport}`}
            >
              <DownloadIcon className="w-3 h-3 opacity-80" />
              Export
            </button>

            <button
              disabled={busy}
              onClick={() => setMenuExport((v) => !v)}
              className={`${btnBase} rounded-l-none px-1.5 ${ringExport}`}
            >
              <ChevronDownIcon
                className={`w-2.5 h-2.5 opacity-80 transition-transform duration-150 ${
                  menuExport ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {menuExport && (
            <div
              className="absolute z-30 mt-[-1px] min-w-[80px] left-0 rounded-b-lg border border-t-0
                         border-slate-300 bg-white/98 text-slate-800 shadow-[0_6px_18px_-10px_rgba(0,0,0,.25)]
                         dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
                         animate-[menuIn_.12s_ease-out_both]"
            >
              <button
                onClick={() => doExport("json")}
                className="block w-full text-center px-2.5 py-[3px] text-[11.5px]
                           text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700
                           rounded-b-lg transition"
              >
                .json
              </button>
            </div>
          )}
        </div>

        {/* Import Split Button */}
        <div ref={wrapImportRef} className="relative">
          <div className="flex">
            <button
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className={`${btnBase} justify-center rounded-r-none px-2.5 ${ringImport}`}
            >
              <UploadIcon className="w-3 h-3 opacity-80" />
              Import
            </button>

            <button
              disabled={busy}
              onClick={() => setMenuImport((v) => !v)}
              className={`${btnBase} rounded-l-none px-1.5 ${ringImport}`}
            >
              <ChevronDownIcon
                className={`w-2.5 h-2.5 opacity-80 transition-transform duration-150 ${
                  menuImport ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {menuImport && (
            <div
              className="absolute z-30 mt-[-1px] min-w-[120px] max-w-[140px] left-0 rounded-b-lg border border-t-0
                         border-slate-300 bg-white/98 text-slate-800 shadow-[0_6px_18px_-10px_rgba(0,0,0,.25)]
                         dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
                         animate-[menuIn_.12s_ease-out_both]"
            >
              <button
                onClick={() => {
                  setMenuImport(false);
                  fileInputRef.current?.click();
                }}
                className="block w-full text-center px-2.5 py-[3px] text-[11.5px]
                           text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700
                           rounded-b-lg transition"
              >
                from TestForge
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <style>
        {`
          @keyframes menuIn {
            from { opacity: 0; transform: translateY(-2px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {confirm.ui}
    </>
  );
}
