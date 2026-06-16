"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, IndianRupee, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Priority } from "@/lib/db-enums";

export interface KanbanTaskData {
  id: string;
  title: string;
  priority: Priority;
  status: string;
  amount?: number | null;
  customer?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  tags?: { tag: { id: string; name: string; color: string } }[];
  _count?: { comments: number; attachments: number };
}

export function KanbanCard({ task, onClick }: { task: KanbanTaskData; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const lastActivity = task.updatedAt || task.createdAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "crm-card p-3.5 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-60 rotate-1 scale-[1.02] shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
      )}
    >
      <h4 className="text-sm font-semibold text-[#33475b] dark:text-white leading-snug mb-1 line-clamp-2 hover:text-[#0091ae] transition-colors">
        {task.title}
      </h4>

      {task.customer ? (
        <p className="text-[11px] font-medium text-[#0091ae] truncate mb-2">{task.customer}</p>
      ) : (
        <p className="text-[11px] text-slate-400 italic mb-2">No customer</p>
      )}

      <div className="flex items-center gap-1.5 mb-2">
        <IndianRupee className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className={cn(
          "text-sm font-bold",
          task.amount != null ? "text-[#33475b] dark:text-white" : "text-slate-400 font-normal text-xs italic"
        )}>
          {formatCurrency(task.amount)}
        </span>
      </div>

      <div className="space-y-1.5 pt-2.5 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        {task.assignee ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="h-3 w-3 text-slate-400 shrink-0" />
            <Avatar name={task.assignee.name} src={task.assignee.avatar} size="sm" />
            <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{lastActivity ? `Last activity ${formatDate(lastActivity)}` : "No activity"}</span>
        </div>
      </div>
    </div>
  );
}
