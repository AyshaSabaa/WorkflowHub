"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api-client";
import { Zap, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface Rule { id: string; name: string; description?: string | null; trigger: string; action: string; isActive: boolean; }

const TRIGGERS: Record<string, string> = { TASK_CREATED: "Task Created", STATUS_CHANGED: "Status Changed", DUE_DATE_APPROACHING: "Due Date Approaching", OVERDUE: "Overdue" };

export default function AutomationPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger: "STATUS_CHANGED", action: "SEND_NOTIFICATION" });

  const load = () => api.getAutomationRules().then((d) => setRules((d as { rules: Rule[] }).rules)).catch(() => toast.error("Failed to load rules"));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await api.createAutomationRule({ ...form, conditions: {}, config: {} });
      toast.success("Rule created");
      setShowCreate(false);
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <>
      <Header title="Automation" subtitle="Auto-assign, reminders, escalations" action={
        user?.role === "ADMIN" ? <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />New Rule</Button> : undefined
      } />
      <div className="flex-1 overflow-y-auto p-6">
        {rules.length === 0 ? <EmptyState icon={Zap} title="No automation rules" description="Create rules to automate your workflows" action={user?.role === "ADMIN" ? () => setShowCreate(true) : undefined} actionLabel="Create Rule" />
          : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{rules.map((r) => (
            <Card key={r.id}><CardContent className="p-5">
              <div className="flex justify-between mb-2"><h3 className="font-semibold">{r.name}</h3><span className={`text-xs px-2 py-1 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-secondary"}`}>{r.isActive ? "Active" : "Inactive"}</span></div>
              {r.description && <p className="text-sm text-muted-foreground mb-2">{r.description}</p>}
              <p className="text-xs text-muted-foreground">When: <strong>{TRIGGERS[r.trigger]}</strong> → Then: <strong>{r.action.replace(/_/g, " ")}</strong></p>
            </CardContent></Card>
          ))}</div>}
      </div>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Automation Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Trigger</Label>
              <select className="mt-1 w-full h-9 rounded-md border px-2 text-sm dark:bg-slate-900" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>
                {Object.entries(TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><Label>Action</Label>
              <select className="mt-1 w-full h-9 rounded-md border px-2 text-sm dark:bg-slate-900" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                <option value="ASSIGN_USER">Auto Assign</option><option value="SEND_NOTIFICATION">Send Notification</option><option value="SEND_EMAIL">Send Email</option><option value="ESCALATE">Escalate</option><option value="CHANGE_STATUS">Change Status</option>
              </select>
            </div>
            <Button onClick={handleCreate} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
