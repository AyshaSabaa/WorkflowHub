import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { paginationSchema } from "@/lib/validations";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canViewAuditLogs(user.role)) return jsonError("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 50,
    });
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");

    const where = {
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return jsonOk({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}
