"use client";

import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { KanbanCard, KanbanTaskData } from "./kanban-card";
import { cn, formatCurrency, sumAmounts } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ColumnData {
  id: string;
  name: string;
  slug?: string | null;
  color: string;
  tasks: KanbanTaskData[];
}

export function KanbanColumn({
  column,
  onAddTask,
  onTaskClick,
  onRename,
  onDelete,
}: {
  column: ColumnData;
  onAddTask: (columnId: string) => void;
  onTaskClick: (taskId: string) => void;
  onRename: (columnId: string, name: string) => void;
  onDelete: (columnId: string) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });
  const { attributes, listeners, setNodeRef: setSortRef, transform, transition, isDragging } = useSortable({
    id: `col-${column.id}`,
    data: { type: "column", columnId: column.id },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const taskIds = column.tasks.map((t) => t.id);
  const stageTotal = sumAmounts(column.tasks);

  const handleRename = () => {
    const name = prompt("Column name:", column.name);
    if (name?.trim()) onRename(column.id, name.trim());
  };

  return (
    <div
      ref={setSortRef}
      style={style}
      className={cn(
        "crm-column flex w-[min(288px,85vw)] sm:w-72 shrink-0 flex-col overflow-hidden snap-center",
        isDragging && "opacity-70 scale-[0.99]"
      )}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2 gap-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button {...attributes} {...listeners} className="p-0.5 cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0">
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: column.color }} />
          <h3 className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">{column.name}</h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-white/10 rounded-full px-2 py-0.5 shrink-0 shadow-sm">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onAddTask(column.id)}>
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRename}><Pencil className="h-4 w-4 mr-2" />Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(column.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={setDropRef}
        className={cn(
          "flex-1 space-y-2.5 px-2.5 pb-2.5 min-h-[220px] transition-colors duration-200",
          isOver && "bg-[#0091ae]/[0.04] ring-2 ring-inset ring-[#0091ae]/20 rounded-xl mx-1"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
      </div>

      <div className="bg-white/60 dark:bg-[#111827]/80 backdrop-blur-sm px-3 py-2.5 space-y-1 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#33475b] dark:text-white">{formatCurrency(stageTotal)}</span>
          <span className="text-slate-400">Total amount</span>
        </div>
        <div className="text-[10px] text-slate-400">
          {column.tasks.filter((t) => t.amount != null).length} deal{column.tasks.filter((t) => t.amount != null).length !== 1 ? "s" : ""} with amount
        </div>
      </div>
    </div>
  );
}
