"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { ColumnData } from "@/components/board/kanban-column";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { formatCurrency, sumAmounts } from "@/lib/utils";
import { getProspectColumnId } from "@/lib/pipeline-stages";
import { Plus, Columns3 } from "lucide-react";
import { Priority } from "@/lib/db-enums";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [board, setBoard] = useState<{ id: string; name: string; department: string; columns: ColumnData[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(searchParams.get("task"));
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    customer: "",
    amount: "",
    priority: "MEDIUM" as Priority,
    assigneeId: "",
    dueDate: "",
  });
  const [columnForm, setColumnForm] = useState({ name: "", color: "#6366f1" });
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const isPipeline = board?.name.toLowerCase().includes("pipeline") || board?.department === "Sales";
  const dealLabel = isPipeline ? "Deal" : "Task";

  const loadBoard = useCallback(() => {
    setLoading(true);
    api.getBoard(boardId).then((d) => {
      const b = (d as { board: { id: string; name: string; department: string; columns: { id: string; name: string; color: string; tasks: ColumnData["tasks"] }[] } }).board;
      setBoard({ ...b, columns: b.columns.map((c) => ({ id: c.id, name: c.name, slug: (c as { slug?: string }).slug, color: c.color, tasks: c.tasks || [] })) });
    }).catch(() => toast.error("Failed to load board")).finally(() => setLoading(false));
  }, [boardId]);

  useEffect(() => { loadBoard(); api.getUsers().then((d) => setUsers((d as { users: typeof users }).users)).catch(() => {}); }, [loadBoard]);

  const canManageColumns = user?.role === "ADMIN" || user?.role === "MANAGER";
  const pipelineValue = board ? sumAmounts(board.columns.flatMap((c) => c.tasks)) : 0;

  const resetTaskForm = () => setTaskForm({
    title: "", description: "", customer: "", amount: "", priority: "MEDIUM", assigneeId: "", dueDate: "",
  });

  const handleCreateTask = async () => {
    if (!taskForm.title || !newTaskColumn) return toast.error("Title required");
    try {
      await api.createTask({
        title: taskForm.title,
        description: taskForm.description || undefined,
        customer: taskForm.customer || null,
        amount: taskForm.amount ? parseInt(taskForm.amount, 10) : null,
        priority: taskForm.priority,
        boardId,
        columnId: newTaskColumn,
        assigneeId: taskForm.assigneeId || null,
        dueDate: taskForm.dueDate || null,
      });
      toast.success(`${dealLabel} created`);
      setShowNewTask(false);
      resetTaskForm();
      loadBoard();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const handleCreateColumn = async () => {
    if (!columnForm.name) return toast.error("Column name required");
    try {
      await api.createColumn(boardId, columnForm);
      toast.success("Stage created");
      setShowNewColumn(false);
      setColumnForm({ name: "", color: "#6366f1" });
      loadBoard();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  if (loading) return <><Header title="Loading..." /><div className="p-6"><Skeleton className="h-96 w-full" /></div></>;

  return (
    <>
      <Header
        title={board?.name || "Board"}
        subtitle={board?.department}
        action={
          <div className="flex items-center gap-3">
            {isPipeline && (
              <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                Pipeline Value: {formatCurrency(pipelineValue)}
              </Badge>
            )}
            {canManageColumns && (
              <Button variant="outline" size="sm" onClick={() => setShowNewColumn(true)}>
                <Columns3 className="h-4 w-4" />Add Stage
              </Button>
            )}
            <Button size="sm" onClick={() => { setNewTaskColumn(board ? getProspectColumnId(board.columns) : ""); setShowNewTask(true); }}>
              <Plus className="h-4 w-4" />Add {dealLabel}
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden p-6">
        {board && (
          <KanbanBoard
            columns={board.columns}
            boardId={boardId}
            onTaskClick={setSelectedTask}
            onAddTask={(colId) => { setNewTaskColumn(colId); setShowNewTask(true); }}
            onColumnsChange={loadBoard}
          />
        )}
      </div>

      <TaskDetailDialog taskId={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} onUpdate={loadBoard} isDeal={isPipeline} />

      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create {dealLabel}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Customer Name</Label><Input className="mt-1" value={taskForm.customer} onChange={(e) => setTaskForm({ ...taskForm, customer: e.target.value })} placeholder="ABC Pvt Ltd" /></div>
            <div><Label>{dealLabel} Title</Label><Input className="mt-1" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Website Development" /></div>
            <div><Label>Description</Label><Textarea className="mt-1" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deal Amount (₹)</Label>
                <Input type="number" min="0" className="mt-1" value={taskForm.amount} onChange={(e) => setTaskForm({ ...taskForm, amount: e.target.value })} placeholder="50000" />
              </div>
              <div>
                <Label>Expected Close Date</Label>
                <Input type="date" className="mt-1" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Priority</Label>
                <select className="mt-1 w-full h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}>
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div><Label>Assigned Salesperson</Label>
                <select className="mt-1 w-full h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
              <Button onClick={handleCreateTask}>Create {dealLabel}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewColumn} onOpenChange={setShowNewColumn}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stage</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Stage Name</Label><Input className="mt-1" value={columnForm.name} onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })} placeholder="Prospect" /></div>
            <div><Label>Color</Label><Input type="color" className="mt-1 h-10" value={columnForm.color} onChange={(e) => setColumnForm({ ...columnForm, color: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewColumn(false)}>Cancel</Button>
              <Button onClick={handleCreateColumn}>Add Stage</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
