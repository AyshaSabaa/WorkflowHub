"use client";

import { useEffect, useState } from "react";
import { Bell, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Logo } from "@/components/brand/logo";
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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-4 min-w-0">
        <Logo variant="header" className="hidden sm:flex" />
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ff7a59] text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
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
                        "px-4 py-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer",
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
        <Button size="sm" onClick={() => router.push("/boards")}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>
    </header>
  );
}
