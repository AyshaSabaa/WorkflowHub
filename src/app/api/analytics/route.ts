import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api-response";
import { subDays, startOfDay, eachDayOfInterval, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") || 30);
    const start = startOfDay(subDays(new Date(), days));

    const [completed, pending, byUser, byTeam, byBoard, byPriority] = await Promise.all([
      prisma.task.count({ where: { completedAt: { gte: start }, isArchived: false } }),
      prisma.task.count({ where: { completedAt: null, isArchived: false } }),
      prisma.task.groupBy({ by: ["assigneeId"], where: { completedAt: { gte: start }, isArchived: false, assigneeId: { not: null } }, _count: true }),
      prisma.task.groupBy({ by: ["teamId"], where: { completedAt: { gte: start }, isArchived: false, teamId: { not: null } }, _count: true }),
      prisma.task.groupBy({ by: ["boardId"], where: { isArchived: false }, _count: true }),
      prisma.task.groupBy({ by: ["priority"], where: { isArchived: false }, _count: true }),
    ]);

    const users = await prisma.user.findMany({
      where: { id: { in: byUser.map((u) => u.assigneeId!).filter(Boolean) } },
      select: { id: true, name: true, department: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const teams = await prisma.team.findMany({
      where: { id: { in: byTeam.map((t) => t.teamId!).filter(Boolean) } },
      select: { id: true, name: true, department: true },
    });
    const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

    const boards = await prisma.board.findMany({
      where: { id: { in: byBoard.map((b) => b.boardId) } },
      select: { id: true, name: true, department: true },
    });
    const boardMap = Object.fromEntries(boards.map((b) => [b.id, b]));

    const dailyTrend = await Promise.all(
      eachDayOfInterval({ start, end: new Date() }).map(async (day) => {
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        const count = await prisma.task.count({ where: { completedAt: { gte: day, lt: next }, isArchived: false } });
        return { date: format(day, "MMM d"), count };
      })
    );

    const monthStart = startOfMonth(subMonths(new Date(), 5));
    const monthlyTrend = await Promise.all(
      eachMonthOfInterval({ start: monthStart, end: new Date() }).map(async (month) => {
        const count = await prisma.task.count({
          where: { completedAt: { gte: month, lte: endOfMonth(month) }, isArchived: false },
        });
        return { month: format(month, "MMM yyyy"), count };
      })
    );

    return jsonOk({
      summary: { completed, pending },
      completedByUser: byUser.map((u) => ({ user: userMap[u.assigneeId!], count: u._count })),
      completedByTeam: byTeam.map((t) => ({ team: teamMap[t.teamId!], count: t._count })),
      boardAnalytics: byBoard.map((b) => ({ board: boardMap[b.boardId], count: b._count })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
      dailyTrend,
      monthlyTrend,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
