"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn, ColumnData } from "./kanban-column";
import { KanbanCard, KanbanTaskData } from "./kanban-card";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function KanbanBoard({
  columns: initialColumns,
  boardId,
  dealLabel = "Deal",
  canDeleteTask,
  onTaskClick,
  onTaskEdit,
  onTaskMove,
  onTaskDuplicate,
  onTaskDelete,
  onAddTask,
  onColumnsChange,
}: {
  columns: ColumnData[];
  boardId: string;
  dealLabel?: string;
  canDeleteTask: (task: KanbanTaskData) => boolean;
  onTaskClick: (taskId: string) => void;
  onTaskEdit: (taskId: string) => void;
  onTaskMove: (task: KanbanTaskData, columnId: string) => void;
  onTaskDuplicate: (task: KanbanTaskData, columnId: string) => void;
  onTaskDelete: (task: KanbanTaskData) => void;
  onAddTask: (columnId: string) => void;
  onColumnsChange?: () => void;
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<KanbanTaskData | null>(null);

  useEffect(() => { setColumns(initialColumns); }, [initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findColumn = useCallback((taskId: string) => columns.find((c) => c.tasks.some((t) => t.id === taskId)), [columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith("col-")) return;
    const col = findColumn(id);
    const task = col?.tasks.find((t) => t.id === id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || String(active.id).startsWith("col-")) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeCol = findColumn(activeId);
    let overCol = columns.find((c) => c.id === overId);
    if (!overCol) overCol = findColumn(overId);
    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    setColumns((prev) => {
      const aItems = [...activeCol.tasks];
      const oItems = [...overCol!.tasks];
      const idx = aItems.findIndex((t) => t.id === activeId);
      const [moved] = aItems.splice(idx, 1);
      oItems.push(moved);
      return prev.map((c) => {
        if (c.id === activeCol.id) return { ...c, tasks: aItems };
        if (c.id === overCol!.id) return { ...c, tasks: oItems };
        return c;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("col-")) {
      const oldIndex = columns.findIndex((c) => `col-${c.id}` === activeId);
      const newIndex = columns.findIndex((c) => `col-${c.id}` === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(columns, oldIndex, newIndex);
        setColumns(reordered);
        try {
          await api.reorderColumns(boardId, reordered.map((c) => c.id));
          toast.success("Columns reordered");
        } catch {
          toast.error("Failed to reorder columns");
          const data = await api.getBoard(boardId) as { board: { columns: ColumnData[] } };
          setColumns(data.board.columns.map((c) => ({ ...c, tasks: c.tasks || [] })));
        }
      }
      return;
    }

    const activeCol = findColumn(activeId);
    let overCol = columns.find((c) => c.id === overId);
    if (!overCol) overCol = findColumn(overId);
    if (!activeCol || !overCol) return;

    let newPosition = overCol.tasks.findIndex((t) => t.id === overId);
    if (newPosition === -1) newPosition = overCol.tasks.length;

    if (activeCol.id === overCol.id) {
      const oldIndex = activeCol.tasks.findIndex((t) => t.id === activeId);
      const newIndex = overCol.tasks.findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex && newIndex !== -1) {
        setColumns((prev) => prev.map((c) => c.id === activeCol.id ? { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) } : c));
        newPosition = newIndex;
      }
    }

    try {
      await api.moveTask(activeId, overCol.id, newPosition);
      onColumnsChange?.();
    } catch {
      toast.error("Failed to move task");
      const data = await api.getBoard(boardId) as { board: { columns: ColumnData[] } };
      setColumns(data.board.columns.map((c) => ({ ...c, tasks: c.tasks || [] })));
    }
  };

  const handleRename = async (columnId: string, name: string) => {
    try {
      await api.updateColumn(columnId, { name });
      setColumns((prev) => prev.map((c) => c.id === columnId ? { ...c, name } : c));
      toast.success("Column renamed");
    } catch { toast.error("Failed to rename column"); }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Delete this column?")) return;
    try {
      await api.deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      toast.success("Column deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to delete column"); }
  };

  const handleDeleteTask = (task: KanbanTaskData) => {
    onTaskDelete(task);
  };

  const columnSortIds = columns.map((c) => `col-${c.id}`);

  return (
    <div className="h-full min-h-0">
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <SortableContext items={columnSortIds} strategy={horizontalListSortingStrategy}>
        <div className="flex h-full min-h-0 gap-4 sm:gap-5 overflow-x-auto overflow-y-hidden pb-4 px-1 snap-x snap-mandatory scroll-smooth items-stretch">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              dealLabel={dealLabel}
              canDeleteTask={canDeleteTask}
              onAddTask={onAddTask}
              onTaskClick={onTaskClick}
              onTaskEdit={onTaskEdit}
              onTaskMove={onTaskMove}
              onTaskDuplicate={onTaskDuplicate}
              onTaskDelete={handleDeleteTask}
              onRename={handleRename}
              onDelete={handleDeleteColumn}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeTask && (
          <KanbanCard
            task={activeTask}
            dealLabel={dealLabel}
            canDelete={false}
            onClick={() => {}}
            onEdit={() => {}}
            onMove={() => {}}
            onDuplicate={() => {}}
            onDelete={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
    </div>
  );
}
