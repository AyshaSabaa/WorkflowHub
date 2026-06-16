/** String enum values used with MongoDB (Prisma does not support native enums on MongoDB). */

export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const ActivityAction = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  TASK_CREATED: "TASK_CREATED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_DELETED: "TASK_DELETED",
  TASK_MOVED: "TASK_MOVED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  STATUS_CHANGED: "STATUS_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
  BOARD_CREATED: "BOARD_CREATED",
  BOARD_UPDATED: "BOARD_UPDATED",
  BOARD_DELETED: "BOARD_DELETED",
  COLUMN_CREATED: "COLUMN_CREATED",
  COLUMN_UPDATED: "COLUMN_UPDATED",
  COLUMN_DELETED: "COLUMN_DELETED",
  COLUMN_REORDERED: "COLUMN_REORDERED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  TEAM_CREATED: "TEAM_CREATED",
  TEAM_UPDATED: "TEAM_UPDATED",
} as const;
export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];

export const NotificationType = {
  ASSIGNMENT: "ASSIGNMENT",
  MENTION: "MENTION",
  DUE_DATE: "DUE_DATE",
  STATUS_CHANGE: "STATUS_CHANGE",
  ESCALATION: "ESCALATION",
  COMMENT: "COMMENT",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
