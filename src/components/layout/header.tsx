"use client";

import { useEffect, useState } from "react";
import { Bell, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/utils";

export function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; createdAt: string; isRead: boolean }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    api.getNotifications().then((data) => {
      const result = data as { notifications: typeof notifications; unreadCount: number };
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    }).catch(() => {});
    const interval = setInterval(() => {
      api.getNotifications(true).then((data) => {
        setUnreadCount((data as { unreadCount: number }).unreadCount);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    await api.markNotificationsRead(undefined, true);
    setUnreadCount(0);
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
  };

  return (
    <header className="crm-header flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 z-10">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {action}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl border border-transparent hover:border-black/[0.05] dark:hover:border-white/[0.08] hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ff7a59] text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-[#111827] shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.08]">
                <span className="font-medium text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#ff7a59] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors",
                        !n.isRead && "bg-orange-50/50 dark:bg-orange-900/10"
                      )}
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatRelative(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <Button
          size="sm"
          className="shadow-[0_2px_8px_rgba(255,122,89,0.35)] hover:shadow-[0_4px_12px_rgba(255,122,89,0.45)] transition-shadow"
          onClick={() => router.push("/boards")}
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>
    </header>
  );
}
