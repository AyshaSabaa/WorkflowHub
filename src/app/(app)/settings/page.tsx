"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { ROLE_LABELS } from "@/lib/utils";
import { UserRole } from "@/lib/db-enums";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"profile" | "users" | "teams" | "company" | "api">("profile");
  const [users, setUsers] = useState<{ id: string; email: string; name: string; role: UserRole; department?: string | null }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; department: string; members: { user: { name: string } }[] }[]>([]);
  const [company, setCompany] = useState({ name: "", timezone: "UTC" });
  const [showUser, setShowUser] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", name: "", role: "EMPLOYEE" as UserRole, department: "" });

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    api.getUsers().then((d) => setUsers((d as { users: typeof users }).users)).catch(() => {});
    api.getTeams().then((d) => setTeams((d as { teams: typeof teams }).teams)).catch(() => {});
    api.getCompanySettings().then((d) => { const s = (d as { settings: typeof company }).settings; setCompany({ name: s.name, timezone: s.timezone }); }).catch(() => {});
  }, []);

  const createUser = async () => {
    try {
      await api.createUser(userForm);
      toast.success("User created");
      setShowUser(false);
      const d = await api.getUsers() as { users: typeof users };
      setUsers(d.users);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const saveCompany = async () => {
    try {
      await api.updateCompanySettings(company);
      toast.success("Settings saved");
    } catch { toast.error("Failed to save"); }
  };

  return (
    <>
      <Header title="Settings" subtitle="Manage users, teams, and company" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-2 mb-6 border-b">
          {(["profile", "users", "teams", "company", "api"] as const).filter((t) => t !== "users" && t !== "company" || isAdmin).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? "border-[#ff7a59] text-[#ff7a59]" : "border-transparent text-muted-foreground"}`}>
              {t === "api" ? "API" : t === "company" ? "Company" : t}
            </button>
          ))}
        </div>

        {tab === "profile" && user && (
          <Card className="max-w-lg"><CardHeader><CardTitle>Your Profile</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar name={user.name} src={user.avatar} size="lg" />
              <div><p className="font-semibold text-lg">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p><p className="text-xs text-muted-foreground mt-1">{ROLE_LABELS[user.role]}</p></div>
            </CardContent>
          </Card>
        )}

        {tab === "users" && isAdmin && (
          <Card className="crm-card--flat">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <Button size="sm" onClick={() => setShowUser(true)}><Plus className="h-4 w-4" />Add User</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Department</th></tr></thead>
                <tbody>{users.map((u) => (
                  <tr key={u.id} className="border-b"><td className="px-4 py-3 flex items-center gap-2"><Avatar name={u.name} size="sm" />{u.name}</td><td className="px-4 py-3 text-muted-foreground">{u.email}</td><td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-secondary">{ROLE_LABELS[u.role]}</span></td><td className="px-4 py-3 text-muted-foreground">{u.department || "—"}</td></tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {tab === "teams" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t) => (
              <Card key={t.id}><CardContent className="p-5">
                <h3 className="font-semibold">{t.name}</h3><p className="text-sm text-muted-foreground">{t.department}</p>
                <div className="flex flex-wrap gap-1 mt-3">{t.members.map((m) => <span key={m.user.name} className="text-xs px-2 py-1 rounded-full bg-secondary">{m.user.name}</span>)}</div>
              </CardContent></Card>
            ))}
          </div>
        )}

        {tab === "company" && isAdmin && (
          <Card className="max-w-lg"><CardHeader><CardTitle>Company Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Company Name</Label><Input className="mt-1" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></div>
              <div><Label>Timezone</Label><Input className="mt-1" value={company.timezone} onChange={(e) => setCompany({ ...company, timezone: e.target.value })} /></div>
              <Button onClick={saveCompany}>Save Settings</Button>
            </CardContent>
          </Card>
        )}

        {tab === "api" && (
          <Card className="max-w-2xl"><CardHeader><CardTitle>REST API</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Authenticate with <code className="bg-secondary px-1 rounded">Authorization: Bearer TOKEN</code></p>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs">
                <p>POST /api/auth/login</p><p>GET /api/tasks</p><p>GET /api/boards</p><p>PATCH /api/tasks/:id/move</p><p>GET /api/export?format=xlsx</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showUser} onOpenChange={setShowUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
            <div><Label>Password</Label><PasswordInput className="mt-1" autoComplete="new-password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
            <div><Label>Role</Label>
              <select className="mt-1 w-full h-9 rounded-md border px-2 text-sm dark:bg-slate-900" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}>
                <option value="ADMIN">Admin</option><option value="MANAGER">Manager</option><option value="EMPLOYEE">Employee</option>
              </select>
            </div>
            <Button onClick={createUser} className="w-full">Create User</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
