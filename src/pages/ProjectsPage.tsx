// src/features/projects/pages/ProjectsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { http } from "@/lib/http";
// Entities (new structure)
import {
  createProject,
  listAllProjects,
  updateProject,
  deleteProject,
  bulkArchiveProjectsByGroup,
} from "@/entities/project";
import type { Project } from "@/entities/project";
import { useConfirm, AlertBanner } from "@/shared/ui/alert";
import SearchInput from "@/shared/ui/search/SearchInput";
import { ProjectsHeader, ProjectsTable, ProjectCreateForm } from "@/features/projects";
import InlineEditCell from "@/shared/ui/table/InlineEditCell";

/* ---------------- constants ---------------- */
const FAV_KEY = "projects.favs";
const SORT_BY_KEY = "projects.sortBy";
const SORT_DIR_KEY = "projects.sortDir";
const COLS_KEY = "projects.visibleCols";
const SELECT_ROW = "bg-emerald-50/80 dark:bg-white/10";
const DEFAULT_COLS = { code: true, meta: true, group: true };
const PAD_THRESHOLD = 10;

/* ---------------- main ---------------- */
export default function ProjectsPage() {
  const confirmDlg = useConfirm();

  const [items, setItems] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<
    Array<{ id: number; name: string; personal: boolean }>
  >([]);

  /* visible columns */
  const [cols, setCols] = useState(() => {
    try {
      return {
        ...DEFAULT_COLS,
        ...JSON.parse(localStorage.getItem(COLS_KEY) || "{}"),
      };
    } catch {
      return DEFAULT_COLS;
    }
  });
  useEffect(() => localStorage.setItem(COLS_KEY, JSON.stringify(cols)), [cols]);

  /* favorites */
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? (JSON.parse(raw) as number[]) : []);
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (id: number) =>
    setFavorites((prev) => {
      const ns = new Set(prev);
      ns.has(id) ? ns.delete(id) : ns.add(id);
      return ns;
    });

  /* load groups + projects */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { data: myGroups } = await http.get<any[]>("/api/groups/my");
        if (!alive) return;
        setGroups(
          (myGroups || []).map((g) => ({
            id: g.id,
            name: g.name,
            personal: !!g.personal,
          }))
        );

        const all = await listAllProjects();
        if (!alive) return;
        const nameMap = new Map(
          myGroups.map((g: any) => [
            g.id,
            { name: g.name, personal: !!g.personal },
          ])
        );
        setItems(
          all.map((p) => ({
            ...p,
            groupName: p.groupName || nameMap.get(p.groupId)?.name || "",
            groupPersonal:
              p.groupPersonal ?? !!nameMap.get(p.groupId)?.personal,
          }))
        );
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load projects");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* load stats */
  useEffect(() => {
    if (!items.length) return;
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        items.map(async (p) => {
          try {
            const [suites, cases, runs, milestones] = await Promise.all([
              http.get<any[]>(`/api/projects/${p.id}/suites`),
              http.get<any[]>(`/api/projects/${p.id}/cases`),
              http.get<any[]>(`/api/projects/${p.id}/runs`),
              http.get<any[]>(`/api/projects/${p.id}/milestones`),
            ]);
            return [
              p.id,
              {
                suites: suites.data.length,
                cases: cases.data.length,
                runs: runs.data.length,
                milestones: milestones.data.length,
              },
            ];
          } catch {
            return [p.id, { suites: 0, cases: 0, runs: 0, milestones: 0 }];
          }
        })
      );
      if (alive) setStats(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [items]);

  /* form state */
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    groupId: null as number | null,
  });
  const [formErr, setFormErr] = useState<string | null>(null);
  const trimmedName = form.name.trim();
  const createDisabled = trimmedName.length < 3 || !form.groupId;

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (createDisabled) return;
    setCreating(true);
    try {
      const created = await createProject(form.groupId!, {
        name: trimmedName,
        code: Math.random().toString(36).substring(2, 6).toUpperCase(),
        description: form.description.trim() || undefined,
      });
      const g = groups.find((x) => x.id === form.groupId);
      const newProject: Project = {
        ...created,
        groupId: created.groupId ?? form.groupId!,
        groupName: created.groupName ?? g?.name ?? "",
        groupPersonal: created.groupPersonal ?? !!g?.personal,
      };
      setItems((prev): Project[] => [newProject, ...prev]);
      setForm({ name: "", description: "", groupId: null });
      setShowCreate(false);
    } catch (e: any) {
      setFormErr(e?.response?.data?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  /* edit / delete */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [freezeSort, setFreezeSort] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [banner, setBanner] = useState<{
    kind: "error" | "info";
    text: string;
  } | null>(null);

  const toggleSelect = (id: number, v?: boolean) =>
    setSelectedIds((prev) => {
      const ns = new Set(prev);
      const on = v != null ? v : !ns.has(id);
      on ? ns.add(id) : ns.delete(id);
      return ns;
    });

  const saveEdit = async (p: Project, newName: string) => {
    setSavingEdit(true);
    try {
      const updated = await updateProject(p.groupId!, p.id, {
        name: newName.trim() || undefined,
      });
      setFreezeSort(true);
      setItems((prev): Project[] =>
        prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x))
      );
      setTimeout(() => setFreezeSort(false), 700);
    } catch (e: any) {
      setBanner({
        kind: "error",
        text: e?.response?.data?.message || "Update failed",
      });
      setTimeout(() => setBanner(null), 2500);
    } finally {
      setSavingEdit(false);
      setEditingId(null);
      setEditName("");
    }
  };

  const doDeleteProject = async (p: Project) => {
    try {
      await deleteProject(p.groupId!, p.id);
      setItems((prev) => prev.filter((x) => x.id !== p.id));
      setStats((prev) => {
        const { [p.id]: _, ...rest } = prev;
        return rest;
      });
    } catch (e: any) {
      setBanner({
        kind: "error",
        text: e?.response?.data?.message || "Delete failed",
      });
      setTimeout(() => setBanner(null), 2500);
    }
  };

  const bulkDelete = () => {
    if (!selectedIds.size) return;
    confirmDlg.open(
      `Delete ${selectedIds.size} project${
        selectedIds.size > 1 ? "s" : ""
      }? This cannot be undone.`,
      async () => {
        try {
          const ids = Array.from(selectedIds);
          const byGroup: Record<number, number[]> = {};
          for (const id of ids) {
            const p = items.find((x) => x.id === id);
            if (p?.groupId != null) (byGroup[p.groupId] ||= []).push(id);
          }
          for (const [gidStr, idsInGroup] of Object.entries(byGroup)) {
            await bulkArchiveProjectsByGroup(Number(gidStr), idsInGroup);
          }
          setItems((prev) => prev.filter((x) => !selectedIds.has(x.id)));
          setSelectedIds(new Set());
        } catch (e: any) {
          setBanner({
            kind: "error",
            text: e?.response?.data?.message || "Bulk delete failed",
          });
          setTimeout(() => setBanner(null), 2500);
        }
      }
    );
  };

  /* sort + search */
  const [sortBy, setSortBy] = useState<"name" | "fav" | "group">(
    (localStorage.getItem(SORT_BY_KEY) as any) || "name"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    (localStorage.getItem(SORT_DIR_KEY) as any) || "asc"
  );
  useEffect(() => localStorage.setItem(SORT_BY_KEY, sortBy), [sortBy]);
  useEffect(() => localStorage.setItem(SORT_DIR_KEY, sortDir), [sortDir]);

  const filteredItems = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(s) ||
        (p.code || "").toLowerCase().includes(s) ||
        (p.groupName || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  const sortedItems = useMemo(() => {
    if (freezeSort) return filteredItems;
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      if (sortBy === "fav") {
        const af = favorites.has(a.id);
        const bf = favorites.has(b.id);
        if (af !== bf) return sortDir === "asc" ? (bf ? 1 : -1) : af ? -1 : 1;
      } else if (sortBy === "group") {
        return sortDir === "asc"
          ? (a.groupName || "").localeCompare(b.groupName || "")
          : (b.groupName || "").localeCompare(a.groupName || "");
      }
      return sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
    return sorted;
  }, [filteredItems, sortBy, sortDir, favorites, freezeSort]);

  /* pagination */
  const [pageSize, setPageSize] = useState<number>(12);
  const [page, setPage] = useState<number>(1);
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedItems = useMemo(() => {
    if (!pageSize) return sortedItems;
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

  const projectNameTable =
    "min-w-0 text-[16px] sm:text-[17px] font-semibold leading-[1.12] tracking-[-0.01em] text-slate-900 dark:text-slate-100";

  /* ---------------- render ---------------- */
  return (
    <div className="px-4 py-8 mx-auto max-w-7xl">
      {banner && <AlertBanner kind={banner.kind}>{banner.text}</AlertBanner>}

      <ProjectsHeader
        totalItems={items.length}
        selectedCount={selectedIds.size}
        onBulkDelete={bulkDelete}
        onToggleCreate={() => setShowCreate((v) => !v)}
        showCreate={showCreate}
        cols={cols}
        setCols={setCols}
      >
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search"
          className="w-80"
          storageKey="projects.search"
        />
      </ProjectsHeader>

      {showCreate && (
        <ProjectCreateForm
          form={form}
          setForm={setForm}
          groups={groups}
          onCreate={onCreate}
          onCancel={() => setShowCreate(false)}
          creating={creating}
          disabled={createDisabled}
          error={formErr}
        />
      )}

      <div className="dark:[&_button]:text-slate-200 dark:[&_button:hover]:text-white">
        <ProjectsTable
          items={items}
          pagedItems={pagedItems}
          stats={stats}
          favorites={favorites}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          cols={cols}
          sortBy={sortBy}
          sortDir={sortDir}
          loading={loading}
          err={err}
          toggleSelect={toggleSelect}
          toggleFavorite={toggleFavorite}
          renderName={(p) => (
            <InlineEditCell
              id={p.id}
              value={p.name}
              isEditing={editingId === p.id}
              draft={editName}
              setDraft={setEditName}
              onSave={() => saveEdit(p, editName)}
              onCancel={() => {
                setEditingId(null);
                setEditName("");
              }}
              saving={savingEdit}
            />
          )}
          doDeleteProject={doDeleteProject}
          confirmDlg={confirmDlg}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          setPage={setPage}
          setPageSize={setPageSize}
          setSortBy={setSortBy}
          setSortDir={setSortDir}
          freezeSort={freezeSort}
          setFreezeSort={setFreezeSort}
          SELECT_ROW={SELECT_ROW}
          projectNameTable={projectNameTable}
          needPad={
            pageSize > 0
              ? pagedItems.length < Math.min(PAD_THRESHOLD, pageSize)
              : pagedItems.length < PAD_THRESHOLD
          }
          colCount={
            3 +
            (cols.code ? 1 : 0) +
            (cols.meta ? 1 : 0) +
            (cols.group ? 1 : 0) +
            1
          }
          banner={banner}
          setBanner={setBanner}
          setEditingId={setEditingId}
          setEditName={setEditName}
        />
      </div>

      {confirmDlg.ui}
    </div>
  );
}
