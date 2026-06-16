"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Kanban, Search, BarChart3, Zap, Shield, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { Logo } from "@/components/brand/logo";
import { cn, ROLE_LABELS } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/boards", label: "Boards", icon: Kanban },
  { href: "/search", label: "Search", icon: Search },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/audit-logs", label: "Audit Logs", icon: Shield, roles: ["ADMIN", "MANAGER"] },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    window.location.href = "/login";
  };

  return (
    <aside className="crm-sidebar flex h-screen w-64 shrink-0 flex-col text-white">
      <Link href="/dashboard" className="crm-sidebar-brand">
        <Logo variant="sidebar" className="max-w-[200px]" />
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/[0.08] p-4 space-y-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors duration-200"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        {user && (
          <div className="flex items-center gap-3 px-2">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
