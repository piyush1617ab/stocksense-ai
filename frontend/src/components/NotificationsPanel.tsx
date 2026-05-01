import { useState, useEffect, useRef } from "react";
import { Bell, TrendingUp, TrendingDown, BookOpen, Newspaper, X, Check } from "lucide-react";

interface Notification {
  id: string;
  type: "price" | "alert" | "lesson" | "news";
  title: string;
  description: string;
  time: string;
  read: boolean;
  symbol?: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "price", title: "RELIANCE up 1.1%", description: "Reliance Industries rose ₹32.15 today", time: "2m ago", read: false, symbol: "RELIANCE" },
  { id: "2", type: "alert", title: "Price Alert Triggered", description: "TCS dropped below ₹3800 — your alert level", time: "15m ago", read: false, symbol: "TCS" },
  { id: "3", type: "lesson", title: "New Lesson Available", description: "Understanding RSI: When to buy and sell", time: "1h ago", read: false },
  { id: "4", type: "news", title: "RBI Policy Update", description: "Interest rates kept unchanged — markets steady", time: "2h ago", read: true },
  { id: "5", type: "price", title: "ITC steady growth", description: "ITC up 1.21% backed by FMCG strength", time: "3h ago", read: true, symbol: "ITC" },
];

const iconMap = {
  price: TrendingUp,
  alert: TrendingDown,
  lesson: BookOpen,
  news: Newspaper,
};

const colorMap = {
  price: "bg-success-muted text-success",
  alert: "bg-danger-muted text-danger",
  lesson: "bg-primary/10 text-primary",
  news: "bg-muted text-muted-foreground",
};

const NotificationsPanel = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifications(notifications.filter((n) => n.id !== id));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/20 hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border bg-card shadow-xl overflow-hidden z-50 animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconMap[n.type];
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/30 ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorMap[n.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
