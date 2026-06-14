import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "@/features/notifications/hooks";
import type { Notification } from "@/db/schema";

const TYPE_ICON: Record<string, string> = {
  COMMENT_ADDED: "💬",
  STAGE_CHANGED: "📋",
  BIRTHDAY_UPCOMING: "🎂",
  JOB_MEMBER_ADDED: "👤",
  AGREEMENT_RENEWAL_DUE: "📄",
  AGREEMENT_OVERDUE: "⚠️",
  AGREEMENT_LAPSED: "🚨",
};

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function NotifItem({
  notif,
  onNavigate,
}: {
  notif: Notification;
  onNavigate: () => void;
}) {
  const markRead = useMarkRead();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notif.isRead) markRead.mutate(notif.id);
    if (notif.jobId) {
      navigate({ to: "/jobs/$jobId", params: { jobId: notif.jobId } });
      onNavigate();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-0 ${notif.isRead ? "" : "bg-emerald-50/60"}`}>
      <span className="text-base shrink-0 mt-0.5">
        {TYPE_ICON[notif.type] ?? "🔔"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">
          {notif.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notif.body}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {timeAgo(notif.createdAt)}
        </p>
      </div>
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
      )}
    </button>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const markAllRead = useMarkAllRead();

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-primary leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border bg-popover shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                onClick={() => markAllRead.mutate()}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onNavigate={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
