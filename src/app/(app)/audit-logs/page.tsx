"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api-client";
import { formatRelative } from "@/lib/utils";
import { Shield } from "lucide-react";

interface AuditLog {
  id: string; action: string; entityType: string; entityId?: string | null; createdAt: string;
  user?: { name: string; email: string } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getAuditLogs(page, filter ? { action: filter } : undefined)
      .then((d) => { const r = d as { logs: AuditLog[]; pages: number }; setLogs(r.logs); setPages(r.pages); })
      .finally(() => setLoading(false));
  }, [page, filter]);

  return (
    <>
      <Header title="Audit Logs" subtitle="Complete audit trail" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex gap-2">
          {["", "LOGIN", "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"].map((a) => (
            <Button key={a} size="sm" variant={filter === a ? "default" : "outline"} onClick={() => { setFilter(a); setPage(1); }}>{a || "All"}</Button>
          ))}
        </div>
        <Card>
          {loading ? <CardContent className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</CardContent>
            : logs.length === 0 ? <EmptyState icon={Shield} title="No audit logs" />
            : <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="px-4 py-3">Time</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">ID</th></tr></thead>
                <tbody>{logs.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-accent/50">
                    <td className="px-4 py-3 text-muted-foreground">{formatRelative(l.createdAt)}</td>
                    <td className="px-4 py-3">{l.user?.name || "System"}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-secondary">{l.action}</span></td>
                    <td className="px-4 py-3">{l.entityType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.entityId?.slice(0, 8)}...</td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>}
        </Card>
        {pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm self-center">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </div>
    </>
  );
}
