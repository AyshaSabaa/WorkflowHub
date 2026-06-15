import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return jsonOk({ tags });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const data = tagSchema.parse(body);

    const tag = await prisma.tag.upsert({
      where: { name: data.name },
      create: { name: data.name, color: data.color || "#94a3b8" },
      update: { color: data.color },
    });

    return jsonOk({ tag }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
