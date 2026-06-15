import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { taskSchema, paginationSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity, createNotification } from "@/lib/activity";
import { columnStatus } from "@/lib/pipeline-stages";
import { Priority } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 50,
    });

    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const boardId = searchParams.get("boardId");
    const priority = searchParams.get("priority") as Priority | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where = {
      isArchived: false,
      ...(boardId ? { boardId } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(priority ? { priority } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo
        ? { dueDate: { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) } }
        : {}),
      ...(search
        ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatar: true, email: true } },
          creator: { select: { id: true, name: true } },
          board: { select: { id: true, name: true, department: true } },
          column: { select: { id: true, name: true, color: true } },
          team: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return jsonOk({ tasks, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canCreateTasks(user.role)) return jsonError("Forbidden", 403);

    const data = taskSchema.parse(await req.json());
    const column = await prisma.column.findUnique({ where: { id: data.columnId } });
    if (!column) return jsonError("Column not found", 404);

    const maxPos = await prisma.task.aggregate({ where: { columnId: data.columnId, isArchived: false }, _max: { position: true } });

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || "MEDIUM",
        status: columnStatus(column),
        boardId: data.boardId,
        columnId: data.columnId,
        assigneeId: data.assigneeId,
        teamId: data.teamId,
        creatorId: user.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        amount: data.amount ?? null,
        customer: data.customer ?? null,
        position: (maxPos._max.position ?? -1) + 1,
        ...(data.tagIds?.length ? { tags: { create: data.tagIds.map((tagId) => ({ tagId })) } } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        column: true,
        tags: { include: { tag: true } },
      },
    });

    await logActivity({ taskId: task.id, userId: user.id, action: "TASK_CREATED", message: `${user.name} created task "${task.title}"` });

    if (task.assigneeId && task.assigneeId !== user.id) {
      await createNotification({
        userId: task.assigneeId,
        type: "ASSIGNMENT",
        title: "New task assigned",
        message: `You were assigned "${task.title}"`,
        link: `/boards/${task.boardId}?task=${task.id}`,
      });
    }

    await createAuditLog({ userId: user.id, action: "CREATE", entityType: "Task", entityId: task.id, details: { title: task.title } });

    return jsonOk({ task }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
