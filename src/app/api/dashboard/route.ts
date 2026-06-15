import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api-response";
import { startOfWeek, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const weekStart = startOfWeek(new Date());
    const now = new Date();

    const [total, completed, pending, overdue, byStatus, byPriority, recentActivity, recentTasks, teamProductivity] =
      await Promise.all([
        prisma.task.count({ where: { isArchived: false } }),
        prisma.task.count({ where: { completedAt: { not: null }, isArchived: false } }),
        prisma.task.count({ where: { completedAt: null, isArchived: false } }),
        prisma.task.count({ where: { dueDate: { lt: now }, completedAt: null, isArchived: false } }),
        prisma.task.groupBy({ by: ["status"], where: { isArchived: false }, _count: true }),
        prisma.task.groupBy({ by: ["priority"], where: { isArchived: false }, _count: true }),
        prisma.activityLog.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            task: { select: { id: true, title: true, boardId: true } },
          },
        }),
        prisma.task.findMany({
          where: { isArchived: false },
          take: 8,
          orderBy: { updatedAt: "desc" },
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            column: { select: { name: true, color: true } },
            board: { select: { name: true } },
          },
        }),
        prisma.user.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            avatar: true,
            department: true,
            _count: { select: { assignedTasks: { where: { completedAt: { gte: subDays(now, 30) }, isArchived: false } } } },
          },
          orderBy: { assignedTasks: { _count: "desc" } },
          take: 10,
        }),
      ]);

    const completedThisWeek = await prisma.task.count({
      where: { completedAt: { gte: weekStart }, isArchived: false },
    });

    return jsonOk({
      stats: {
        total,
        completed,
        pending,
        overdue,
        completedThisWeek,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
      },
      recentActivity,
      recentTasks,
      teamProductivity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
