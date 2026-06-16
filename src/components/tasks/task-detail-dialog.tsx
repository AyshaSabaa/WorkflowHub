"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { PRIORITY_CONFIG, formatDate, formatRelative, formatCurrency } from "@/lib/utils";
import { getStageLabel } from "@/lib/pipeline-stages";
import { cn } from "@/lib/utils";
import { Paperclip, Send, Clock } from "lucide-react";
import { Priority } from "@/lib/db-enums";
import { toast } from "sonner";

interface TaskDetail {
  id: string;
  title: string;
  description?: string | null;
  customer?: string | null;
  amount?: number | null;
  priority: Priority;
  status: string;
  dueDate?: string | null;
  createdAt: string;
  boardId: string;
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  creator: { name: string };
  tags: { tag: { id: string; name: string; color: string } }[];
  comments: { id: string; content: string; createdAt: string; author: { name: string; avatar?: string | null } }[];
  attachments: { id: string; fileName: string; fileSize: number; createdAt: string }[];
  activityLogs: { id: string; message: string; createdAt: string; user: { name: string } }[];
}

export function TaskDetailDialog({
  taskId,
  open,
  onClose,
  onUpdate,
  isDeal = false,
}: {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  isDeal?: boolean;
}) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"details" | "activity" | "attachments">("details");
  const label = isDeal ? "Deal" : "Task";

  useEffect(() => {
    if (open && taskId) {
      setLoading(true);
      Promise.all([api.getTask(taskId), api.getUsers()])
        .then(([t, u]) => {
          setTask((t as { task: TaskDetail }).task);
          setUsers((u as { users: { id: string; name: string }[] }).users);
        })
        .catch(() => toast.error(`Failed to load ${label.toLowerCase()}`))
        .finally(() => setLoading(false));
    }
  }, [open, taskId, label]);

  const updateField = async (field: string, value: unknown) => {
    if (!task) return;
    try {
      await api.updateTask(task.id, { [field]: value });
      setTask({ ...task, [field]: value });
      onUpdate?.();
      toast.success(`${label} updated`);
    } catch { toast.error("Update failed"); }
  };

  const submitComment = async () => {
    if (!task || !comment.trim()) return;
    try {
      const data = await api.addComment(task.id, comment) as { comment: { id: string; content: string; createdAt: string; author: { id: string; name: string; avatar?: string | null } } };
      setTask({ ...task, comments: [...task.comments, data.comment] });
      setComment("");
      toast.success("Comment added");
    } catch { toast.error("Failed to add comment"); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files?.[0]) return;
    try {
      await api.uploadAttachment(task.id, e.target.files[0]);
      const data = await api.getTask(task.id) as { task: TaskDetail };
      setTask(data.task);
      onUpdate?.();
      toast.success("File uploaded");
    } catch { toast.error("Upload failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{loading ? "Loading..." : task?.title}</DialogTitle>
          {task?.customer && <p className="text-sm text-[#0091ae]">{task.customer}</p>}
        </DialogHeader>
        {loading ? (
          <div className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : task ? (
          <div className="flex flex-col lg:flex-row min-h-[480px]">
            <div className="flex-1 p-6 border-r dark:border-slate-800">
              <div className="flex gap-2 mb-4 border-b dark:border-slate-800">
                {(["details", "activity", "attachments"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-2 text-sm font-medium capitalize border-b-2 -mb-px", tab === t ? "border-[#ff7a59] text-[#ff7a59]" : "border-transparent text-slate-500")}>{t}</button>
                ))}
              </div>
              {tab === "details" && (
                <div className="space-y-4">
                  <div><Label>Description</Label><Textarea className="mt-1" value={task.description || ""} onChange={(e) => setTask({ ...task, description: e.target.value })} onBlur={() => updateField("description", task.description)} rows={4} /></div>
                  <div className="space-y-3">
                    <Label>Comments</Label>
                    {task.comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar name={c.author.name} src={c.author.avatar} size="sm" />
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                          <div className="flex gap-2 mb-1"><span className="text-sm font-medium">{c.author.name}</span><span className="text-xs text-slate-400">{formatRelative(c.createdAt)}</span></div>
                          <p className="text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." onKeyDown={(e) => e.key === "Enter" && submitComment()} />
                      <Button size="icon" onClick={submitComment}><Send className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              )}
              {tab === "activity" && task.activityLogs.map((a) => (
                <div key={a.id} className="flex gap-3 text-sm mb-3"><Clock className="h-4 w-4 text-slate-400 mt-0.5" /><div><p>{a.message}</p><p className="text-xs text-slate-400">{formatRelative(a.createdAt)}</p></div></div>
              ))}
              {tab === "attachments" && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-[#ff7a59] cursor-pointer"><Paperclip className="h-4 w-4" />Upload file<input type="file" className="hidden" onChange={handleUpload} /></label>
                  {task.attachments.map((a) => (
                    <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <div><p className="text-sm font-medium">{a.fileName}</p><p className="text-xs text-slate-400">{(a.fileSize / 1024).toFixed(1)} KB</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full lg:w-64 p-6 bg-slate-50 dark:bg-slate-900/50 space-y-4">
              <div>
                <Label>Deal Amount</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1"
                  value={task.amount ?? ""}
                  onChange={(e) => setTask({ ...task, amount: e.target.value ? parseInt(e.target.value, 10) : null })}
                  onBlur={() => updateField("amount", task.amount ?? null)}
                  placeholder="Enter amount"
                />
                <p className="text-sm font-semibold mt-1 text-[#33475b] dark:text-white">{formatCurrency(task.amount)}</p>
              </div>
              <div>
                <Label>Customer</Label>
                <Input className="mt-1" value={task.customer || ""} onChange={(e) => setTask({ ...task, customer: e.target.value })} onBlur={() => updateField("customer", task.customer || null)} />
              </div>
              <div><Label>Priority</Label>
                <select className="mt-1 w-full h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={task.priority} onChange={(e) => updateField("priority", e.target.value)}>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div><Label>{isDeal ? "Stage" : "Status"}</Label><p className="text-sm font-medium mt-1">{isDeal ? getStageLabel(task.status) : task.status}</p></div>
              <div><Label>Assigned To</Label>
                <select className="mt-1 w-full h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={task.assignee?.id || ""} onChange={(e) => updateField("assigneeId", e.target.value || null)}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div><Label>Expected Close Date</Label><Input type="date" className="mt-1" value={task.dueDate?.split("T")[0] || ""} onChange={(e) => updateField("dueDate", e.target.value || null)} /></div>
              <div><Label>Created</Label><p className="text-sm mt-1">{formatDate(task.createdAt)}</p></div>
              <div><Label>Created by</Label><p className="text-sm mt-1">{task.creator.name}</p></div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
