import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(2),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  department: z.string().optional(),
});

export const boardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  department: z.string().min(1),
  teamId: z.string().optional().nullable(),
});

export const columnSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  color: z.string().optional(),
  position: z.number().int().optional(),
});

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string()).min(1),
});

export const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  boardId: z.string(),
  columnId: z.string(),
  assigneeId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  amount: z.number().int().nonnegative().nullable().optional(),
  customer: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string(),
  position: z.number().int().min(0),
});

export const commentSchema = z.object({
  content: z.string().min(1),
  mentions: z.array(z.string()).optional(),
});

export const savedFilterSchema = z.object({
  name: z.string().min(1),
  filters: z.record(z.string(), z.unknown()),
  isDefault: z.boolean().optional(),
});

export const automationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  boardId: z.string().optional().nullable(),
  trigger: z.enum(["TASK_CREATED", "STATUS_CHANGED", "DUE_DATE_APPROACHING", "OVERDUE"]),
  action: z.enum(["ASSIGN_USER", "SEND_NOTIFICATION", "SEND_EMAIL", "CHANGE_STATUS", "ESCALATE"]),
  conditions: z.record(z.string(), z.unknown()),
  config: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional(),
});

export const teamSchema = z.object({
  name: z.string().min(1),
  department: z.string().min(1),
  description: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export const companySettingsSchema = z.object({
  name: z.string().min(1).optional(),
  logo: z.string().optional().nullable(),
  timezone: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
