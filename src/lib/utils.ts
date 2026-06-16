import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { UserRole } from "@/lib/db-enums";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(typeof date === "string" ? new Date(date) : date, { addSuffix: true });
}

export function formatDueDate(date: Date | string | null | undefined) {
  if (!date) return { label: "No due date", isOverdue: false, isUrgent: false };
  const d = typeof date === "string" ? new Date(date) : date;
  const overdue = isPast(d) && !isToday(d);
  const urgent = isToday(d) || isTomorrow(d);
  let label = format(d, "MMM d, yyyy");
  if (isToday(d)) label = "Today";
  else if (isTomorrow(d)) label = "Tomorrow";
  return { label, isOverdue: overdue, isUrgent: urgent };
}

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", dot: "bg-slate-400" },
  MEDIUM: { label: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", dot: "bg-blue-500" },
  HIGH: { label: "High", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", dot: "bg-amber-500" },
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", dot: "bg-red-500" },
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

/** Format amount in Indian Rupees (e.g. ₹1,50,000) */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Amount not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sumAmounts(tasks: { amount?: number | null }[]): number {
  return tasks.reduce((sum, t) => sum + (t.amount ?? 0), 0);
}
