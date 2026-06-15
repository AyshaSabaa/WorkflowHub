import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { companySettingsSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    let settings = await prisma.companySettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.companySettings.create({ data: { id: "default" } });
    }
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canManageCompany(user.role)) return jsonError("Forbidden", 403);

    const data = companySettingsSchema.parse(await req.json());
    const settings = await prisma.companySettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });

    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
