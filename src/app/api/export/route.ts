import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonError, handleApiError } from "@/lib/api-response";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canExport(user.role)) return jsonError("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const formatType = searchParams.get("format") || "xlsx";
    const boardId = searchParams.get("boardId");

    const tasks = await prisma.task.findMany({
      where: { isArchived: false, ...(boardId ? { boardId } : {}) },
      include: {
        assignee: { select: { name: true, email: true } },
        board: { select: { name: true, department: true } },
        column: { select: { name: true } },
        team: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const rows = tasks.map((t) => ({
      Title: t.title,
      Customer: t.customer || "",
      Amount: t.amount ?? "",
      Status: t.status,
      Priority: t.priority,
      Assignee: t.assignee?.name || "",
      Board: t.board.name,
      Department: t.board.department,
      Column: t.column.name,
      Team: t.team?.name || "",
      "Due Date": t.dueDate ? format(t.dueDate, "yyyy-MM-dd") : "",
      Completed: t.completedAt ? format(t.completedAt, "yyyy-MM-dd") : "",
      Created: format(t.createdAt, "yyyy-MM-dd"),
    }));

    if (formatType === "json") {
      return new Response(JSON.stringify(rows), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="tasks-${format(new Date(), "yyyy-MM-dd")}.json"` },
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="tasks-${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
