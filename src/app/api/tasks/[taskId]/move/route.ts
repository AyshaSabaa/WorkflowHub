import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { moveTaskSchema } from "@/lib/validations";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/activity";
import { createAuditLog } from "@/lib/audit";
import { columnStatus, isDealClosedStage } from "@/lib/pipeline-stages";

type Params = { params: Promise<{ taskId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { taskId } = await params;
    const { columnId, position } = moveTaskSchema.parse(await req.json());

    const existing = await prisma.task.findUnique({ where: { id: taskId }, include: { column: true } });
    if (!existing) return jsonError("Task not found", 404);

    const newColumn = await prisma.column.findUnique({ where: { id: columnId } });
    if (!newColumn) return jsonError("Column not found", 404);

    const isClosed = isDealClosedStage(newColumn);

    const task = await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { columnId, position: { gte: position }, id: { not: taskId }, isArchived: false },
        data: { position: { increment: 1 } },
      });

      return tx.task.update({
        where: { id: taskId },
        data: {
          columnId,
          position,
          status: columnStatus(newColumn),
          ...(isClosed ? { completedAt: new Date() } : { completedAt: null }),
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          column: true,
          tags: { include: { tag: true } },
        },
      });
    });

    if (existing.columnId !== columnId) {
      await logActivity({
        taskId,
        userId: user.id,
        action: "TASK_MOVED",
        message: `Moved from "${existing.column.name}" to "${newColumn.name}"`,
        metadata: { from: existing.column.name, to: newColumn.name },
      });
      await createAuditLog({ userId: user.id, action: "STATUS_CHANGE", entityType: "Task", entityId: taskId, details: { from: existing.column.name, to: newColumn.name } });

      if (task.assigneeId) {
        await createNotification({
          userId: task.assigneeId,
          type: "STATUS_CHANGE",
          title: "Status updated",
          message: `"${task.title}" moved to ${newColumn.name}`,
          link: `/boards/${task.boardId}?task=${taskId}`,
        });
      }
    }

    return jsonOk({ task });
  } catch (error) {
    return handleApiError(error);
  }
}
