import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword, sanitizeUser } from "@/lib/auth";
import { userSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ userId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageUsers(user.role)) return jsonError("Forbidden", 403);

    const { userId } = await params;
    const data = userSchema.partial().parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.department !== undefined ? { department: data.department } : {}),
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      },
    });

    await logActivity({ userId: user.id, action: "USER_UPDATED", message: `${user.name} updated user ${updated.name}` });
    await createAuditLog({ userId: user.id, action: "UPDATE", entityType: "User", entityId: userId, details: data as object });

    return jsonOk({ user: sanitizeUser(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageUsers(user.role)) return jsonError("Forbidden", 403);

    const { userId } = await params;
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });

    await createAuditLog({ userId: user.id, action: "DEACTIVATE", entityType: "User", entityId: userId });
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
