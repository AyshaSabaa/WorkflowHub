import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { savedFilterSchema } from "@/lib/validations";
import { jsonOk, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const filters = await prisma.savedFilter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ filters });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const data = savedFilterSchema.parse(body);

    if (data.isDefault) {
      await prisma.savedFilter.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const filter = await prisma.savedFilter.create({
      data: {
        name: data.name,
        filters: data.filters as object,
        isDefault: data.isDefault ?? false,
        userId: user.id,
      },
    });

    return jsonOk({ filter }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
