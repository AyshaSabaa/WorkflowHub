import { AuthUser } from "@/types";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== "undefined") this.token = localStorage.getItem("token");
    return this.token;
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let res: Response;
    try {
      res = await fetch(`/api${path}`, { ...options, headers });
    } catch {
      throw new Error("Unable to connect to server");
    }

    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok) {
      if (res.status === 404 && path.startsWith("/auth/")) {
        throw new Error("Authentication service not configured");
      }
      if (res.status === 401 && path.startsWith("/auth/")) {
        throw new Error(data.error || "Incorrect email or password");
      }
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data as T;
  }

  login(email: string, password: string) {
    return this.fetch<{ user: AuthUser; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  }
  me() { return this.fetch<{ user: AuthUser }>("/auth/me"); }
  logout() { return this.fetch("/auth/logout", { method: "POST" }); }

  getDashboard() { return this.fetch("/dashboard"); }
  getBoards(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.fetch(`/boards${qs}`);
  }
  getBoard(id: string) { return this.fetch(`/boards/${id}`); }
  createBoard(data: Record<string, unknown>) { return this.fetch("/boards", { method: "POST", body: JSON.stringify(data) }); }
  updateBoard(id: string, data: Record<string, unknown>) { return this.fetch(`/boards/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
  deleteBoard(id: string) { return this.fetch(`/boards/${id}`, { method: "DELETE" }); }

  createColumn(boardId: string, data: Record<string, unknown>) { return this.fetch(`/boards/${boardId}/columns`, { method: "POST", body: JSON.stringify(data) }); }
  reorderColumns(boardId: string, columnIds: string[]) { return this.fetch(`/boards/${boardId}/columns`, { method: "PATCH", body: JSON.stringify({ columnIds }) }); }
  updateColumn(columnId: string, data: Record<string, unknown>) { return this.fetch(`/columns/${columnId}`, { method: "PATCH", body: JSON.stringify(data) }); }
  deleteColumn(columnId: string) { return this.fetch(`/columns/${columnId}`, { method: "DELETE" }); }

  getTasks(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.fetch(`/tasks${qs}`);
  }
  getTask(id: string) { return this.fetch(`/tasks/${id}`); }
  createTask(data: Record<string, unknown>) { return this.fetch("/tasks", { method: "POST", body: JSON.stringify(data) }); }
  updateTask(id: string, data: Record<string, unknown>) { return this.fetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
  deleteTask(id: string) { return this.fetch(`/tasks/${id}`, { method: "DELETE" }); }
  moveTask(id: string, columnId: string, position: number) { return this.fetch(`/tasks/${id}/move`, { method: "PATCH", body: JSON.stringify({ columnId, position }) }); }
  addComment(taskId: string, content: string, mentions?: string[]) { return this.fetch(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ content, mentions }) }); }
  uploadAttachment(taskId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return this.fetch(`/tasks/${taskId}/attachments`, { method: "POST", body: fd });
  }
  bulkAction(data: Record<string, unknown>) { return this.fetch("/tasks/bulk", { method: "POST", body: JSON.stringify(data) }); }

  getUsers(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.fetch(`/users${qs}`);
  }
  createUser(data: Record<string, unknown>) { return this.fetch("/users", { method: "POST", body: JSON.stringify(data) }); }
  updateUser(id: string, data: Record<string, unknown>) { return this.fetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
  deleteUser(id: string) { return this.fetch(`/users/${id}`, { method: "DELETE" }); }

  getTeams() { return this.fetch("/teams"); }
  createTeam(data: Record<string, unknown>) { return this.fetch("/teams", { method: "POST", body: JSON.stringify(data) }); }
  getTags() { return this.fetch("/tags"); }
  getNotifications(unreadOnly = false) { return this.fetch(`/notifications${unreadOnly ? "?unread=true" : ""}`); }
  markNotificationsRead(ids?: string[], markAll = false) { return this.fetch("/notifications", { method: "PATCH", body: JSON.stringify({ ids, markAll }) }); }
  getAnalytics(days = 30) { return this.fetch(`/analytics?days=${days}`); }
  getAutomationRules() { return this.fetch("/automation"); }
  createAutomationRule(data: Record<string, unknown>) { return this.fetch("/automation", { method: "POST", body: JSON.stringify(data) }); }
  getAuditLogs(page = 1, params?: Record<string, string>) {
    const qs = new URLSearchParams({ page: String(page), ...params });
    return this.fetch(`/audit-logs?${qs}`);
  }
  getSavedFilters() { return this.fetch("/filters"); }
  saveFilter(data: Record<string, unknown>) { return this.fetch("/filters", { method: "POST", body: JSON.stringify(data) }); }
  getCompanySettings() { return this.fetch("/settings/company"); }
  updateCompanySettings(data: Record<string, unknown>) { return this.fetch("/settings/company", { method: "PATCH", body: JSON.stringify(data) }); }
}

export const api = new ApiClient();
