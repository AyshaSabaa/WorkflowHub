"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { PRIORITY_CONFIG, formatDate } from "@/lib/utils";
import { Search, Filter, Save, Download } from "lucide-react";
import { Priority } from "@/lib/db-enums";
import { toast } from "sonner";

interface TaskRow {
  id: string; title: string; priority: Priority; status: string; dueDate?: string | null; boardId: string;
  assignee?: { name: string; avatar?: string | null } | null;
  board: { name: string }; column: { name: string; color: string };
}

export default function SearchPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [savedFilters, setSavedFilters] = useState<{ id: string; name: string; filters: Record<string, string> }[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", assigneeId: "", priority: "", boardId: "", dateFrom: "", dateTo: "" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getBoards().then((d) => setBoards((d as { boards: typeof boards }).boards)).catch(() => {});
    api.getUsers().then((d) => setUsers((d as { users: typeof users }).users)).catch(() => {});
    api.getSavedFilters().then((d) => setSavedFilters((d as { filters: typeof savedFilters }).filters)).catch(() => {});
    loadTasks();
  }, []);

  const loadTasks = (f = filters) => {
    setLoading(true);
    const params: Record<string, string> = {};
    Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
    api.getTasks(params).then((d) => setTasks((d as { tasks: TaskRow[] }).tasks)).catch(() => toast.error("Search failed")).finally(() => setLoading(false));
  };

  const saveFilter = async () => {
    const name = prompt("Filter name:");
    if (!name) return;
    try {
      await api.saveFilter({ name, filters });
      toast.success("Filter saved");
      const d = await api.getSavedFilters() as { filters: typeof savedFilters };
      setSavedFilters(d.filters);
    } catch { toast.error("Failed to save filter"); }
  };

  const applySaved = (f: Record<string, string>) => {
    const merged = { search: "", assigneeId: "", priority: "", boardId: "", dateFrom: "", dateTo: "", ...f };
    setFilters(merged);
    loadTasks(merged);
  };

  const bulkArchive = async () => {
    if (!selected.size) return;
    try {
      await api.bulkAction({ ids: Array.from(selected), action: "archive" });
      toast.success(`${selected.size} tasks archived`);
      setSelected(new Set());
      loadTasks();
    } catch { toast.error("Bulk action failed"); }
  };

  return (
    <>
      <Header title="Search & Filters" subtitle="Find tasks across all boards" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Card><CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyDown={(e) => e.key === "Enter" && loadTasks()} />
            </div>
            <select className="h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={filters.boardId} onChange={(e) => setFilters({ ...filters, boardId: e.target.value })}>
              <option value="">All Boards</option>{boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priorities</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
            </select>
            <select className="h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}>
              <option value="">All Assignees</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-36" />
            <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-36" />
            <Button onClick={() => loadTasks()}><Filter className="h-4 w-4" />Apply</Button>
            <Button variant="outline" onClick={saveFilter}><Save className="h-4 w-4" />Save</Button>
            <Button variant="outline" onClick={() => window.open("/api/export?format=xlsx", "_blank")}><Download className="h-4 w-4" /></Button>
          </div>
          {savedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {savedFilters.map((sf) => (
                <button key={sf.id} onClick={() => applySaved(sf.filters as Record<string, string>)} className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-accent">{sf.name}</button>
              ))}
            </div>
          )}
        </CardContent></Card>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-[#ff7a59]/10 rounded-lg">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={bulkArchive}>Archive</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          : tasks.length === 0 ? <EmptyState icon={Search} title="No tasks found" description="Try adjusting your filters" />
          : tasks.map((t) => (
            <Card key={t.id}><CardContent className="p-4 flex items-center gap-4">
              <input type="checkbox" checked={selected.has(t.id)} onChange={() => setSelected((p) => { const n = new Set(p); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n; })} />
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.column.color }} />
              <Link href={`/boards/${t.boardId}?task=${t.id}`} className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate hover:text-[#ff7a59]">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.board.name} · {t.column.name}</p>
              </Link>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[t.priority].color}`}>{PRIORITY_CONFIG[t.priority].label}</span>
              <span className="text-xs text-muted-foreground w-20">{formatDate(t.dueDate)}</span>
              {t.assignee ? <Avatar name={t.assignee.name} src={t.assignee.avatar} size="sm" /> : <span className="w-6" />}
            </CardContent></Card>
          ))}
      </div>
    </>
  );
}
