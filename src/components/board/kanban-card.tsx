"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Copy, IndianRupee, MoreVertical, MoveRight, Pencil, Trash2, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  tags?: { tag: { id: string; name: string; color: string } }[];
  _count?: { comments: number; attachments: number };
}

export function KanbanCard({
  task,
  dealLabel = "Deal",
  canDelete = false,
  onClick,
  onEdit,
  onMove,
  onDuplicate,
  onDelete,
}: {
  task: KanbanTaskData;
  dealLabel?: string;
  canDelete?: boolean;
  onClick: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const lastActivity = task.updatedAt || task.createdAt;

  const stopDrag = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group crm-card p-3.5 cursor-grab active:cursor-grabbing relative",
        isDragging && "opacity-60 rotate-1 scale-[1.02] shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-semibold text-[#33475b] dark:text-white leading-snug line-clamp-2 hover:text-[#0091ae] transition-colors flex-1 min-w-0">
          {task.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white",
                "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
              )}
              onPointerDown={stopDrag}
              onClick={stopDrag}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{dealLabel} actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44" onClick={stopDrag}>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit {dealLabel}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <MoveRight className="h-4 w-4 mr-2" />
              Move {dealLabel}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate {dealLabel}
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {dealLabel}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
