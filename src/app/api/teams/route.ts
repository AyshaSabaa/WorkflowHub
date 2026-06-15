import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { teamSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const teams = await prisma.team.findMany({
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true, email: true, role: true } } } },
        _count: { select: { boards: true, tasks: true } },
      },
      orderBy: { name: "asc" },
    });
    return jsonOk({ teams });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageTeams(user.role)) return jsonError("Forbidden", 403);

    const data = teamSchema.parse(await req.json());
    const team = await prisma.team.create({
      data: {
        name: data.name,
        department: data.department,
        description: data.description,
        ...(data.memberIds?.length ? { members: { create: data.memberIds.map((userId) => ({ userId })) } } : {}),
      },
      include: { members: { include: { user: true } } },
    });

    await logActivity({ userId: user.id, action: "TEAM_CREATED", message: `${user.name} created team "${team.name}"` });
    return jsonOk({ team }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
