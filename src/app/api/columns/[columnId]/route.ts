import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { columnSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ columnId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageColumns(user.role)) return jsonError("Forbidden", 403);

    const { columnId } = await params;
    const data = columnSchema.partial().parse(await req.json());

    const column = await prisma.column.update({ where: { id: columnId }, data });

    await logActivity({ userId: user.id, action: "COLUMN_UPDATED", message: `${user.name} renamed column to "${column.name}"`, metadata: { columnId } });
    await createAuditLog({ userId: user.id, action: "UPDATE", entityType: "Column", entityId: columnId, details: data as object });

    return jsonOk({ column });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageColumns(user.role)) return jsonError("Forbidden", 403);

    const { columnId } = await params;
    const taskCount = await prisma.task.count({ where: { columnId, isArchived: false } });
    if (taskCount > 0) return jsonError("Cannot delete column with active tasks. Move or archive them first.", 400);

    const column = await prisma.column.delete({ where: { id: columnId } });

    await logActivity({ userId: user.id, action: "COLUMN_DELETED", message: `${user.name} deleted column "${column.name}"` });
    await createAuditLog({ userId: user.id, action: "DELETE", entityType: "Column", entityId: columnId });

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
