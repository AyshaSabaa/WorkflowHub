import { Priority, UserRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  department?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  assigneeId?: string;
  boardId?: string;
  priority?: Priority;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
