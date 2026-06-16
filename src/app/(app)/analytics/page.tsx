"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { PRIORITY_CONFIG } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Priority } from "@/lib/db-enums";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  summary: { completed: number; pending: number };
  completedByUser: { user: { name: string }; count: number }[];
  completedByTeam: { team: { name: string }; count: number }[];
  boardAnalytics: { board: { name: string; department: string }; count: number }[];
  byPriority: { priority: Priority; count: number }[];
  dailyTrend: { date: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export default function AnalyticsPage() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAnalytics(Number(days)).then((d) => setData(d as AnalyticsData)).catch(() => toast.error("Failed to load analytics")).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <><Header title="Analytics" /><div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div></>;

  return (
    <>
      <Header title="Analytics" subtitle="Team productivity and trends" action={
        <div className="flex gap-2">
          <select className="h-9 rounded-md border px-2 text-sm dark:bg-slate-900 dark:border-slate-700" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => { window.open("/api/export?format=xlsx", "_blank"); toast.success("Exporting..."); }}><Download className="h-4 w-4" />Export</Button>
        </div>
      } />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="py-6 text-center"><p className="text-3xl font-bold text-green-600">{data?.summary.completed}</p><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="py-6 text-center"><p className="text-3xl font-bold text-blue-600">{data?.summary.pending}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle>Daily Completion Trend</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#ff7a59" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Monthly Trends</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#00bda5" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card><CardHeader><CardTitle>By User</CardTitle></CardHeader><CardContent className="space-y-2">
            {data?.completedByUser.slice(0, 8).map((u, i) => <div key={i} className="flex justify-between text-sm"><span>{u.user?.name}</span><span className="font-semibold">{u.count}</span></div>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>By Team</CardTitle></CardHeader><CardContent className="space-y-2">
            {data?.completedByTeam.map((t, i) => <div key={i} className="flex justify-between text-sm"><span>{t.team?.name}</span><span className="font-semibold">{t.count}</span></div>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>By Board</CardTitle></CardHeader><CardContent className="space-y-2">
            {data?.boardAnalytics.map((b, i) => <div key={i} className="flex justify-between text-sm"><span>{b.board?.name}</span><span className="font-semibold">{b.count}</span></div>)}
          </CardContent></Card>
        </div>
      </div>
    </>
  );
}
