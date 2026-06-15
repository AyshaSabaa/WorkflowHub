import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { automationSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const rules = await prisma.automationRule.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk({ rules });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageAutomation(user.role)) return jsonError("Forbidden", 403);

    const data = automationSchema.parse(await req.json());
    const rule = await prisma.automationRule.create({
      data: {
        name: data.name,
        description: data.description,
        boardId: data.boardId || null,
        trigger: data.trigger,
        action: data.action,
        conditions: data.conditions as object,
        config: data.config as object,
        isActive: data.isActive ?? true,
      },
    });

    return jsonOk({ rule }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
