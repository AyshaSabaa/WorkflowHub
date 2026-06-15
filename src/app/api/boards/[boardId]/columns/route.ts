import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { columnSchema, reorderColumnsSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ boardId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAuth(req);
    const { boardId } = await params;
    const columns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: "asc" },
      include: { _count: { select: { tasks: { where: { isArchived: false } } } } },
    });
    return jsonOk({ columns });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageColumns(user.role)) return jsonError("Forbidden", 403);

    const { boardId } = await params;
    const data = columnSchema.parse(await req.json());

    const maxPos = await prisma.column.aggregate({ where: { boardId }, _max: { position: true } });

    const column = await prisma.column.create({
      data: {
        boardId,
        name: data.name,
        slug: data.slug || null,
        color: data.color || "#6366f1",
        position: data.position ?? (maxPos._max.position ?? -1) + 1,
      },
    });

    await logActivity({ userId: user.id, action: "COLUMN_CREATED", message: `${user.name} created column "${column.name}"`, metadata: { boardId } });
    await createAuditLog({ userId: user.id, action: "CREATE", entityType: "Column", entityId: column.id, details: { boardId, name: column.name } });

    return jsonOk({ column }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageColumns(user.role)) return jsonError("Forbidden", 403);

    const { boardId } = await params;
    const { columnIds } = reorderColumnsSchema.parse(await req.json());

    await prisma.$transaction(
      columnIds.map((id, index) =>
        prisma.column.update({ where: { id, boardId }, data: { position: index } })
      )
    );

    const columns = await prisma.column.findMany({ where: { boardId }, orderBy: { position: "asc" } });

    await logActivity({ userId: user.id, action: "COLUMN_REORDERED", message: `${user.name} reordered columns`, metadata: { boardId, columnIds } });
    await createAuditLog({ userId: user.id, action: "REORDER", entityType: "Column", entityId: boardId, details: { columnIds } });

    return jsonOk({ columns });
  } catch (error) {
    return handleApiError(error);
  }
}
