import { ActivityAction } from "@prisma/client";
import { prisma } from "./prisma";

export async function logActivity(params: {
  taskId?: string;
  userId: string;
  action: ActivityAction;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activityLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      action: params.action,
      message: params.message,
      metadata: params.metadata as object | undefined,
    },
  });
}

export async function createNotification(params: {
  userId: string;
  type: "ASSIGNMENT" | "MENTION" | "DUE_DATE" | "STATUS_CHANGE" | "ESCALATION" | "COMMENT" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data: params });
}
