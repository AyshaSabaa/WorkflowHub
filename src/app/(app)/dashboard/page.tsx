"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api-client";
import { PRIORITY_CONFIG, formatRelative } from "@/lib/utils";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Download, Plus, Kanban } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Priority } from "@/lib/db-enums";
import { toast } from "sonner";

const CHART_COLORS = ["#ff7a59", "#00bda5", "#6366f1", "#f59e0b", "#8b5cf6", "#22c55e"];

interface DashboardData {
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completedThisWeek: number;
    byStatus: { status: string; count: number }[];
    byPriority: { priority: Priority; count: number }[];
  };
  recentActivity: { id: string; message: string; createdAt: string; user: { name: string; avatar?: string | null }; task?: { title: string; boardId: string } | null }[];
  recentTasks: { id: string; title: string; priority: Priority; boardId: string; assignee?: { name: string; avatar?: string | null } | null; column: { name: string; color: string }; board: { name: string } }[];
  teamProductivity: { id: string; name: string; avatar?: string | null; department?: string | null; _count: { assignedTasks: number } }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getDashboard()
      .then((d) => setData(d as DashboardData))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  if (loading) return (
    <>
      <Header title="Dashboard" subtitle="Loading..." />
      <div className="p-6 grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
    </>
  );

  if (error) return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 text-center"><p className="text-red-500 mb-4">Failed to load dashboard</p><Button onClick={() => window.location.reload()}>Retry</Button></div>
    </>
  );

  return (
    <>
      <Header title="Dashboard" subtitle="Overview of all active work" action={
        <Button variant="outline" size="sm" onClick={() => { window.open("/api/export?format=xlsx", "_blank"); toast.success("Export started"); }}>
          <Download className="h-4 w-4" />Export
        </Button>
      } />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Tasks", value: stats?.total, icon: ListTodo, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
            { label: "Completed", value: stats?.completed, icon: CheckCircle2, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
            { label: "Pending", value: stats?.pending, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
            { label: "Overdue", value: stats?.overdue, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}><CardContent className="flex items-center gap-4 py-4">
              <div className={`p-3 rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{value ?? 0}</p><p className="text-sm text-muted-foreground">{label}</p></div>
            </CardContent></Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/boards"><Button size="sm"><Plus className="h-4 w-4" />Create Board</Button></Link>
          <Link href="/boards"><Button variant="outline" size="sm"><Kanban className="h-4 w-4" />View Boards</Button></Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Tasks by Status</CardTitle></CardHeader>
            <CardContent className="h-64">
              {stats?.byStatus.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7a59" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-12">No data</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>By Priority</CardTitle></CardHeader>
            <CardContent className="h-64">
              {stats?.byPriority.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.byPriority.map((p) => ({ name: PRIORITY_CONFIG[p.priority].label, value: p.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {stats.byPriority.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-12">No data</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-h-80 overflow-y-auto">
              {data?.recentActivity.length ? data.recentActivity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <Avatar name={a.user.name} src={a.user.avatar} size="sm" />
                  <div><p className="text-sm">{a.message}</p><p className="text-[11px] text-muted-foreground">{formatRelative(a.createdAt)}</p></div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No recent activity</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Team Productivity (30d)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data?.teamProductivity.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} src={m.avatar} size="sm" />
                  <div className="flex-1"><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.department}</p></div>
                  <span className="text-sm font-semibold text-[#00bda5]">{m._count.assignedTasks} done</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recently Updated Tasks</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {data?.recentTasks.map((t) => (
              <Link key={t.id} href={`/boards/${t.boardId}?task=${t.id}`} className="flex items-center gap-4 py-3 hover:bg-accent rounded-lg px-2 -mx-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.column.color }} />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.title}</p><p className="text-xs text-muted-foreground">{t.board.name} · {t.column.name}</p></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[t.priority].color}`}>{PRIORITY_CONFIG[t.priority].label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
