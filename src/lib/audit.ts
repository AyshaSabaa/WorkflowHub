import { prisma } from "./prisma";

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown> | object;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details as object | undefined,
      ipAddress: params.ipAddress,
    },
  });
}
