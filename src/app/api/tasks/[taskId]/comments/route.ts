import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { commentSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/permissions";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/activity";

type Params = { params: Promise<{ taskId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    if (!PERMISSIONS.canEditTasks(user.role)) return jsonError("Forbidden", 403);

    const { taskId } = await params;
    const data = commentSchema.parse(await req.json());

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return jsonError("Task not found", 404);

    const comment = await prisma.comment.create({
      data: { taskId, authorId: user.id, content: data.content, mentions: data.mentions || [] },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    await logActivity({ taskId, userId: user.id, action: "COMMENT_ADDED", message: `${user.name} added a comment` });

    for (const mentionId of data.mentions || []) {
      if (mentionId !== user.id) {
        await createNotification({ userId: mentionId, type: "MENTION", title: "You were mentioned", message: `${user.name} mentioned you in "${task.title}"`, link: `/boards/${task.boardId}?task=${taskId}` });
      }
    }

    return jsonOk({ comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
