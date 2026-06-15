import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { boardSchema, paginationSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";
import { SALES_PIPELINE_STAGES } from "@/lib/pipeline-stages";

const DEFAULT_COLUMNS = [
  { name: "To Do", color: "#6366f1", position: 0 },
  { name: "In Progress", color: "#f59e0b", position: 1 },
  { name: "Review", color: "#8b5cf6", position: 2 },
  { name: "Done", color: "#22c55e", position: 3 },
];

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 50,
    });
    const department = searchParams.get("department");
    const includeArchived = searchParams.get("archived") === "true";

    const where = {
      ...(department ? { department } : {}),
      ...(includeArchived ? {} : { isArchived: false }),
    };

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        include: {
          team: true,
          columns: { orderBy: { position: "asc" } },
          _count: { select: { tasks: { where: { isArchived: false } } } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.board.count({ where }),
    ]);

    return jsonOk({ boards, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageBoards(user.role)) return jsonError("Forbidden", 403);

    const data = boardSchema.parse(await req.json());

    const isSalesPipeline = data.department === "Sales" || data.name.toLowerCase().includes("pipeline");
    const columns = isSalesPipeline ? SALES_PIPELINE_STAGES : DEFAULT_COLUMNS;

    const board = await prisma.board.create({
      data: {
        name: data.name,
        description: data.description,
        department: data.department,
        teamId: data.teamId || null,
        columns: { create: columns.map((c) => ({ name: c.name, slug: "slug" in c ? c.slug : null, color: c.color, position: c.position })) },
      },
      include: { columns: { orderBy: { position: "asc" } } },
    });

    await logActivity({ userId: user.id, action: "BOARD_CREATED", message: `${user.name} created board "${board.name}"` });
    await createAuditLog({ userId: user.id, action: "CREATE", entityType: "Board", entityId: board.id, details: { name: board.name } });

    return jsonOk({ board }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
