import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword, sanitizeUser } from "@/lib/auth";
import { userSchema, paginationSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const { page, limit } = paginationSchema.parse({ page: searchParams.get("page") || 1, limit: searchParams.get("limit") || 50 });
    const department = searchParams.get("department");
    const where = { isActive: true, ...(department ? { department } : {}) };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, avatar: true, role: true, department: true, createdAt: true },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return jsonOk({ users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageUsers(user.role)) return jsonError("Forbidden", 403);

    const data = userSchema.parse(await req.json());
    if (!data.password) return jsonError("Password required", 400);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return jsonError("Email already exists", 409);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await hashPassword(data.password),
        name: data.name,
        role: data.role || "EMPLOYEE",
        department: data.department,
      },
    });

    await logActivity({ userId: user.id, action: "USER_CREATED", message: `${user.name} created user ${newUser.name}` });
    await createAuditLog({ userId: user.id, action: "CREATE", entityType: "User", entityId: newUser.id, details: { email: newUser.email } });

    return jsonOk({ user: sanitizeUser(newUser) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
