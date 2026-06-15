import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { boardSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ boardId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAuth(req);
    const { boardId } = await params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        team: true,
        columns: {
          orderBy: { position: "asc" },
          include: {
            tasks: {
              where: { isArchived: false },
              orderBy: { position: "asc" },
              include: {
                assignee: { select: { id: true, name: true, avatar: true, email: true } },
                tags: { include: { tag: true } },
                _count: { select: { comments: true, attachments: true } },
              },
            },
          },
        },
      },
    });

    if (!board) return jsonError("Board not found", 404);
    return jsonOk({ board });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageBoards(user.role)) return jsonError("Forbidden", 403);

    const { boardId } = await params;
    const data = boardSchema.partial().parse(await req.json());

    const board = await prisma.board.update({
      where: { id: boardId },
      data: { ...data, teamId: data.teamId === undefined ? undefined : data.teamId },
      include: { columns: { orderBy: { position: "asc" } } },
    });

    await logActivity({ userId: user.id, action: "BOARD_UPDATED", message: `${user.name} updated board "${board.name}"` });
    await createAuditLog({ userId: user.id, action: "UPDATE", entityType: "Board", entityId: boardId, details: data as object });

    return jsonOk({ board });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageBoards(user.role)) return jsonError("Forbidden", 403);

    const { boardId } = await params;
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return jsonError("Board not found", 404);

    await prisma.board.delete({ where: { id: boardId } });

    await logActivity({ userId: user.id, action: "BOARD_DELETED", message: `${user.name} deleted board "${board.name}"` });
    await createAuditLog({ userId: user.id, action: "DELETE", entityType: "Board", entityId: boardId });

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
