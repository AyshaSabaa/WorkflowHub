import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { taskSchema } from "@/lib/validations";
import { PERMISSIONS, canDeleteTask } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity, createNotification } from "@/lib/activity";
import { z } from "zod";

type Params = { params: Promise<{ taskId: string }> };

const updateSchema = taskSchema.partial().extend({
  isArchived: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAuth(req);
    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true, department: true } },
        creator: { select: { id: true, name: true } },
        board: { select: { id: true, name: true, department: true } },
        column: true,
        team: true,
        tags: { include: { tag: true } },
        comments: { include: { author: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: "asc" } },
        attachments: { include: { uploader: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
        activityLogs: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!task) return jsonError("Task not found", 404);
    return jsonOk({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canEditTasks(user.role)) return jsonError("Forbidden", 403);

    const { taskId } = await params;
    const data = updateSchema.parse(await req.json());
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return jsonError("Task not found", 404);

    const { tagIds, dueDate, boardId, columnId, ...rest } = data;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(tagIds ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        column: true,
        tags: { include: { tag: true } },
      },
    });

    const titleChanged = data.title !== undefined && data.title !== existing.title;

    if (titleChanged) {
      await logActivity({
        taskId,
        userId: user.id,
        action: "TASK_UPDATED",
        message: `Deal title changed from "${existing.title}" to "${data.title}"`,
      });
    } else if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
      await logActivity({ taskId, userId: user.id, action: "TASK_ASSIGNED", message: `${user.name} assigned task to ${task.assignee?.name || "someone"}` });
      if (data.assigneeId) {
        await createNotification({ userId: data.assigneeId, type: "ASSIGNMENT", title: "Task assigned", message: `You were assigned "${task.title}"`, link: `/boards/${task.boardId}?task=${taskId}` });
      }
    } else {
      await logActivity({ taskId, userId: user.id, action: "TASK_UPDATED", message: `${user.name} updated task "${task.title}"` });
    }

    await createAuditLog({ userId: user.id, action: "UPDATE", entityType: "Task", entityId: taskId, details: data as object });

    return jsonOk({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { taskId } = await params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return jsonError("Task not found", 404);

    if (!canDeleteTask(user.role, user.id, task)) {
      return jsonError("Forbidden", 403);
    }

    await prisma.notification.deleteMany({
      where: { link: { contains: taskId } },
    });

    await prisma.task.delete({ where: { id: taskId } });

    await logActivity({ userId: user.id, action: "TASK_DELETED", message: `${user.name} deleted task "${task.title}"` });
    await createAuditLog({ userId: user.id, action: "DELETE", entityType: "Task", entityId: taskId });

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
