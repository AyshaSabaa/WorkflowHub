import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { columnStatus } from "@/lib/pipeline-stages";
import { z } from "zod";
import { Priority } from "@/lib/db-enums";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["archive", "delete", "assign", "changePriority", "changeColumn"]),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  columnId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canBulkActions(user.role)) return jsonError("Forbidden", 403);

    const { ids, action, assigneeId, priority, columnId } = bulkSchema.parse(await req.json());
    let count = 0;

    switch (action) {
      case "archive":
        count = (await prisma.task.updateMany({ where: { id: { in: ids } }, data: { isArchived: true } })).count;
        break;
      case "delete":
        count = (await prisma.task.deleteMany({ where: { id: { in: ids } } })).count;
        break;
      case "assign":
        if (!assigneeId) return jsonError("assigneeId required", 400);
        count = (await prisma.task.updateMany({ where: { id: { in: ids } }, data: { assigneeId } })).count;
        break;
      case "changePriority":
        if (!priority) return jsonError("priority required", 400);
        count = (await prisma.task.updateMany({ where: { id: { in: ids } }, data: { priority } })).count;
        break;
      case "changeColumn":
        if (!columnId) return jsonError("columnId required", 400);
        const col = await prisma.column.findUnique({ where: { id: columnId } });
        if (!col) return jsonError("Column not found", 404);
        count = (await prisma.task.updateMany({ where: { id: { in: ids } }, data: { columnId, status: columnStatus(col) } })).count;
        break;
    }

    await createAuditLog({ userId: user.id, action: `BULK_${action.toUpperCase()}`, entityType: "Task", details: { ids, count } });
    return jsonOk({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
