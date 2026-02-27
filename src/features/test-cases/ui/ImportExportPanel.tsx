// src/features/cases/components/ImportExportPanelMini.tsx
import { useEffect, useRef, useState } from "react";
import { exportCases, importCases } from "@/entities/test-case";
import { UploadIcon, DownloadIcon, ChevronDownIcon } from "@/shared/ui/icons";
import { useConfirm } from "@/shared/ui/alert/Confirm";
import { http } from "@/lib/http";

interface Props {
  projectId: number;
  onAlert?: (text: string, kind?: "info" | "error") => void;
  onImported?: () => void;
}

type ExportFmt = "json";

export default function ImportExportPanelMini({ projectId, onAlert, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputTestRailRef = useRef<HTMLInputElement>(null);
  const wrapExportRef = useRef<HTMLDivElement>(null);
  const wrapImportRef = useRef<HTMLDivElement>(null);
  const exportTimerRef = useRef<NodeJS.Timeout | null>(null);
  const importTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [busy, setBusy] = useState(false);
  const [menuExport, setMenuExport] = useState(false);
  const [menuImport, setMenuImport] = useState(false);
  const confirm = useConfirm();

  const showAlert = (text: string, kind: "info" | "error" = "info") => onAlert?.(text, kind);

  /* ========= HOVER HANDLERS ========= */
  const handleExportEnter = () => {
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    setMenuExport(true);
  };

  const handleExportLeave = () => {
    exportTimerRef.current = setTimeout(() => {
      setMenuExport(false);
    }, 150);
  };

  const handleImportEnter = () => {
    if (importTimerRef.current) clearTimeout(importTimerRef.current);
    setMenuImport(true);
  };

  const handleImportLeave = () => {
    importTimerRef.current = setTimeout(() => {
      setMenuImport(false);
    }, 150);
  };

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

  /* ========= IMPORT FROM TESTRAIL ========= */
  const handleTestRailImport = async (file: File, overwrite = false) => {
    try {
      setBusy(true);
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await http.post(
        `/api/projects/${projectId}/cases/import/testrail`,
        formData,
        {
          params: { overwriteExisting: overwrite },
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      showAlert?.(
        `Import completed: ${data.imported} imported, ${data.skipped} skipped${
          data.updated ? `, ${data.updated} updated` : ""
        }`
      );
      onImported?.();
    } catch (e: any) {
      showAlert?.(e?.response?.data?.message || "Import failed", "error");
    } finally {
      setBusy(false);
      if (fileInputTestRailRef.current) fileInputTestRailRef.current.value = "";
    }
  };

  const onTestRailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    confirm.open(
      "Do you want to replace existing test cases if they already exist in this project?",
      () => handleTestRailImport(file, true),
      { title: "Overwrite existing cases?", okText: "Import (overwrite)", cancelText: "Import (skip)" }
    );
    requestAnimationFrame(() => {
      const cancelBtn = document.querySelector<HTMLButtonElement>("[data-confirm-cancel]");
      cancelBtn?.addEventListener("click", () => handleTestRailImport(file, false), { once: true });
    });
  };

  /* ========= MENU UX ========= */
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) =>
      e.key === "Escape" && (setMenuExport(false), setMenuImport(false));
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("keydown", onEsc);
      // Cleanup timers
      if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
      if (importTimerRef.current) clearTimeout(importTimerRef.current);
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
        <div
          ref={wrapExportRef}
          className="relative"
          onMouseEnter={handleExportEnter}
          onMouseLeave={handleExportLeave}
        >
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
              className="absolute z-30 mt-1 min-w-[120px] left-0 rounded-lg border
                         border-slate-200 bg-white shadow-lg
                         dark:border-slate-700 dark:bg-slate-800
                         animate-[menuIn_.15s_ease-out_both]
                         overflow-hidden"
            >
              <div className="py-0.5">
                <button
                  onClick={() => doExport("json")}
                  className="group w-full flex items-center justify-between px-2 py-1.5 text-xs
                             text-slate-700 hover:bg-slate-50
                             dark:text-slate-200 dark:hover:bg-slate-700/50
                             transition-colors duration-150"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">JSON</span>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">.json</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Import Split Button */}
        <div
          ref={wrapImportRef}
          className="relative"
          onMouseEnter={handleImportEnter}
          onMouseLeave={handleImportLeave}
        >
          <div className="flex">
            <button
              disabled={busy}
              onClick={() => setMenuImport((v) => !v)}
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
              className="absolute z-30 mt-1 min-w-[180px] left-0 rounded-lg border
                         border-slate-200 bg-white shadow-lg
                         dark:border-slate-700 dark:bg-slate-800
                         animate-[menuIn_.15s_ease-out_both]
                         overflow-hidden"
            >
              <div className="py-0.5">
                <button
                  onClick={() => {
                    setMenuImport(false);
                    fileInputRef.current?.click();
                  }}
                  className="group w-full flex items-center gap-1.5 px-2 py-1.5 text-xs
                             text-slate-700 hover:bg-slate-50
                             dark:text-slate-200 dark:hover:bg-slate-700/50
                             transition-colors duration-150"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium">from TestForge</span>
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-0.5" />

                <button
                  onClick={() => {
                    setMenuImport(false);
                    fileInputTestRailRef.current?.click();
                  }}
                  className="group w-full flex items-center gap-1.5 px-2 py-1.5 text-xs
                             text-slate-700 hover:bg-slate-50
                             dark:text-slate-200 dark:hover:bg-slate-700/50
                             transition-colors duration-150"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">from TestRail XML</span>
                </button>
              </div>
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
        <input
          ref={fileInputTestRailRef}
          type="file"
          accept=".xml,application/xml,text/xml"
          onChange={onTestRailFileChange}
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
