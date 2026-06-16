import { UserRole } from "@/lib/db-enums";

const HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export function hasMinRole(userRole: UserRole | string, required: UserRole): boolean {
  const role = userRole as UserRole;
  return (HIERARCHY[role] ?? 0) >= HIERARCHY[required];
}

export const PERMISSIONS = {
  canManageUsers: (r: UserRole | string) => hasMinRole(r, "ADMIN"),
  canManageTeams: (r: UserRole | string) => hasMinRole(r, "ADMIN"),
  canManageCompany: (r: UserRole | string) => hasMinRole(r, "ADMIN"),
  canManageBoards: (r: UserRole | string) => hasMinRole(r, "MANAGER"),
  canManageColumns: (r: UserRole | string) => hasMinRole(r, "MANAGER"),
  canDeleteTasks: (r: UserRole | string) => hasMinRole(r, "MANAGER"),
  canCreateTasks: (r: UserRole | string) => hasMinRole(r, "EMPLOYEE"),
  canEditTasks: (r: UserRole | string) => hasMinRole(r, "EMPLOYEE"),
  canManageAutomation: (r: UserRole | string) => hasMinRole(r, "ADMIN"),
  canViewAuditLogs: (r: UserRole | string) => hasMinRole(r, "MANAGER"),
  canExport: (r: UserRole | string) => hasMinRole(r, "EMPLOYEE"),
  canBulkActions: (r: UserRole | string) => hasMinRole(r, "MANAGER"),
} as const;
