import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, verifyPassword, sanitizeUser } from "@/lib/auth";
import { UserRole } from "@/lib/db-enums";
import { loginSchema } from "@/lib/validations";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return jsonError("Incorrect email or password", 401);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return jsonError("Incorrect email or password", 401);

    const token = signToken({ userId: user.id, email: user.email, role: user.role as UserRole });

    await logActivity({ userId: user.id, action: "LOGIN", message: `${user.name} logged in` });
    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    const response = jsonOk({ user: sanitizeUser(user), token });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
