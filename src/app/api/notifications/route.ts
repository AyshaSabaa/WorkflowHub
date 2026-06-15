import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return jsonOk({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (ids?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { isRead: true },
      });
    }

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
