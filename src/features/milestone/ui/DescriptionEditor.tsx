import { useState, useRef } from "react";
import { PrimaryButton } from "@/shared/ui/buttons";
import { IconBold, IconItalic, IconH1, IconList, IconCode, IconLink, IconImage } from "@/shared/ui/icons/milestones/EditorIcons";
import MarkdownBlock from "@/shared/ui/markdown/TinyMarkdown";
import { htmlToMd, markdownToHtml, placeCaretAtEnd } from "@/shared/utils/editorHelpers";

const controlPill =
  "inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm leading-none " +
  "border-slate-300 text-slate-800 bg-white/80 hover:bg-white hover:shadow-sm hover:-translate-y-0.5 transition " +
  "dark:border-slate-700 dark:text-slate-100 dark:bg-slate-800/70";

export default function DescriptionEditor({ md, onSave }: { md: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [localMd, setLocalMd] = useState(md);
  const rtfRef = useRef<HTMLDivElement | null>(null);

  function open() {
    setEditing(true);
    requestAnimationFrame(() => {
      if (rtfRef.current) {
        rtfRef.current.innerHTML = markdownToHtml(md);
        placeCaretAtEnd(rtfRef.current);
      }
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1524]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Description</h2>
        {!editing ? (
          <button className={controlPill} onClick={open}>Edit</button>
        ) : (
          <div className="flex items-center gap-2">
            <button className={controlPill} onClick={() => setEditing(false)}>Cancel</button>
            <PrimaryButton onClick={() => { onSave(localMd); setEditing(false); }}>Save</PrimaryButton>
          </div>
        )}
      </div>

      {!editing ? (
        localMd ? <MarkdownBlock text={localMd} /> :
        <div className="p-4 text-sm border border-dashed rounded-lg text-slate-500">No description yet.</div>
      ) : (
        <div>
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button type="button" className={controlPill}><IconBold/> Bold</button>
            <button type="button" className={controlPill}><IconItalic/> Italic</button>
            <button type="button" className={controlPill}><IconH1/> H1</button>
            <button type="button" className={controlPill}><IconList/> List</button>
            <button type="button" className={controlPill}><IconCode/> Code</button>
            <button type="button" className={controlPill}><IconLink/> Link</button>
            <button type="button" className={controlPill}><IconImage/> Image</button>
          </div>

          <div
            ref={rtfRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setLocalMd(htmlToMd(rtfRef.current?.innerHTML || ""))}
            className="mt-2 h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-[#0b1222] dark:text-slate-100"
          />
        </div>
      )}
    </section>
  );
}
