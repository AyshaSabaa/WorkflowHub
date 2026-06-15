import { UserRole } from "@prisma/client";

const HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export function hasMinRole(userRole: UserRole, required: UserRole): boolean {
  return HIERARCHY[userRole] >= HIERARCHY[required];
}

export const PERMISSIONS = {
  canManageUsers: (r: UserRole) => hasMinRole(r, "ADMIN"),
  canManageTeams: (r: UserRole) => hasMinRole(r, "ADMIN"),
  canManageCompany: (r: UserRole) => hasMinRole(r, "ADMIN"),
  canManageBoards: (r: UserRole) => hasMinRole(r, "MANAGER"),
  canManageColumns: (r: UserRole) => hasMinRole(r, "MANAGER"),
  canDeleteTasks: (r: UserRole) => hasMinRole(r, "MANAGER"),
  canCreateTasks: (r: UserRole) => hasMinRole(r, "EMPLOYEE"),
  canEditTasks: (r: UserRole) => hasMinRole(r, "EMPLOYEE"),
  canManageAutomation: (r: UserRole) => hasMinRole(r, "ADMIN"),
  canViewAuditLogs: (r: UserRole) => hasMinRole(r, "MANAGER"),
  canExport: (r: UserRole) => hasMinRole(r, "EMPLOYEE"),
  canBulkActions: (r: UserRole) => hasMinRole(r, "MANAGER"),
} as const;
