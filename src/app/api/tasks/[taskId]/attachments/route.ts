import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { extname, join } from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ taskId: string }> };

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canEditTasks(user.role)) return jsonError("Forbidden", 403);

    const { taskId } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return jsonError("No file provided", 400);
    if (file.size > MAX_SIZE) return jsonError("File too large (max 10MB)", 400);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return jsonError("Task not found", 404);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const storageName = `${uuidv4()}${extname(file.name)}`;
    await writeFile(join(/*turbopackIgnore: true*/ UPLOAD_DIR, storageName), Buffer.from(await file.arrayBuffer()));

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        uploaderId: user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        storagePath: storageName,
        versions: { create: { version: 1, storagePath: storageName, fileSize: file.size } },
      },
      include: { uploader: { select: { id: true, name: true } } },
    });

    await logActivity({ taskId, userId: user.id, action: "ATTACHMENT_ADDED", message: `${user.name} uploaded ${file.name}` });

    return jsonOk({ attachment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
