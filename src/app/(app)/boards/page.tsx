"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { Kanban, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface BoardItem {
  id: string;
  name: string;
  description?: string | null;
  department: string;
  _count: { tasks: number };
  columns: { id: string; name: string; color: string }[];
}

export default function BoardsPage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editBoard, setEditBoard] = useState<BoardItem | null>(null);
  const [form, setForm] = useState({ name: "", description: "", department: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getBoards().then((d) => setBoards((d as { boards: BoardItem[] }).boards)).catch(() => toast.error("Failed to load boards")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const handleSave = async () => {
    if (!form.name || !form.department) return toast.error("Name and department required");
    setSaving(true);
    try {
      if (editBoard) {
        await api.updateBoard(editBoard.id, form);
        toast.success("Board updated");
      } else {
        await api.createBoard(form);
        toast.success("Board created");
      }
      setShowCreate(false);
      setEditBoard(null);
      setForm({ name: "", description: "", department: "" });
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (board: BoardItem) => {
    if (!confirm(`Delete board "${board.name}"?`)) return;
    try {
      await api.deleteBoard(board.id);
      toast.success("Board deleted");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const openEdit = (board: BoardItem) => {
    setEditBoard(board);
    setForm({ name: board.name, description: board.description || "", department: board.department });
    setShowCreate(true);
  };

  return (
    <>
      <Header title="Boards" subtitle="Kanban boards for departments and teams" action={
        canManage ? <Button size="sm" onClick={() => { setEditBoard(null); setForm({ name: "", description: "", department: "" }); setShowCreate(true); }}><Plus className="h-4 w-4" />New Board</Button> : undefined
      } />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : boards.length === 0 ? (
          <EmptyState icon={Kanban} title="No boards yet" description="Create your first board to get started" action={canManage ? () => setShowCreate(true) : undefined} actionLabel="Create Board" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Card key={board.id} className="group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/boards/${board.id}`} className="p-2 rounded-lg bg-gradient-to-br from-[#ff7a59]/10 to-[#00bda5]/10"><Kanban className="h-5 w-5 text-[#ff7a59]" /></Link>
                    <div className="flex gap-1">
                      {canManage && <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openEdit(board)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500" onClick={() => handleDelete(board)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>}
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full">{board.department}</span>
                    </div>
                  </div>
                  <Link href={`/boards/${board.id}`}>
                    <h3 className="font-semibold mb-1 hover:text-[#ff7a59]">{board.name}</h3>
                    {board.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{board.description}</p>}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-1">{board.columns.slice(0, 4).map((c) => <div key={c.id} className="h-1.5 w-6 rounded-full" style={{ backgroundColor: c.color }} />)}</div>
                      <span className="text-xs text-muted-foreground">{board._count.tasks} tasks</span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editBoard ? "Edit Board" : "Create Board"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Department</Label><Input className="mt-1" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editBoard ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
