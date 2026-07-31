import { useState, useEffect, useCallback } from "react";
import { Filter, Bell, CheckCheck, ChevronDown } from "lucide-react";
import type { Notification } from "../../types";
import { getStoredToken } from "../../services/auth";
import NotificationSection from "../../components/NotificationSection";
import NotificationCard from "../../components/NotificationCard";
import { motion, AnimatePresence } from "motion/react";

type NotificationCategory =
  | "all"
  | "payment"
  | "approval"
  | "room_change"
  | "warning"
  | "lease";

const categoryFilters: { key: NotificationCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "payment", label: "Payments" },
  { key: "approval", label: "Approvals" },
  { key: "room_change", label: "Room Changes" },
  { key: "warning", label: "Warnings" },
  { key: "lease", label: "Lease Events" },
];

function getCategory(type: string): NotificationCategory {
  if (type.includes("payment")) return "payment";
  if (type.includes("application") || type.includes("room_assigned")) return "approval";
  if (type.includes("room_change") || type.includes("room_switch")) return "room_change";
  if (type.includes("warning") || type.includes("eviction")) return "warning";
  return "lease";
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function TenantManagementHub() {
  const token = getStoredToken();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications?unreadOnly=false&take=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch {
      // ignore
    }
  };

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => getCategory(n.type) === activeFilter);

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">
              Tenant Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              All tenant notifications in one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="relative mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {categoryFilters.find((f) => f.key === activeFilter)?.label || "All"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-10 min-w-[200px]"
              >
                {categoryFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setActiveFilter(f.key);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === f.key
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400 font-sans text-sm">Loading notifications...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="font-display font-bold text-slate-900 text-lg">
              No notifications
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {activeFilter === "all"
                ? "You're all caught up!"
                : `No ${categoryFilters.find((f) => f.key === activeFilter)?.label.toLowerCase()} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {getCategoryCounts(filteredNotifications).map(({ category, count, notifications: cats }) => (
              <NotificationSection
                key={category}
                title={getCategoryTitle(category)}
                count={count}
                notifications={cats}
                category={category}
                onAction={(n) => handleMarkRead(n.notification_id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function getCategoryCounts(
  notifications: Notification[]
): { category: NotificationCategory; count: number; notifications: Notification[] }[] {
  const categories: NotificationCategory[] = [
    "payment",
    "approval",
    "room_change",
    "warning",
    "lease",
  ];
  return categories
    .map((cat) => {
      const filtered = notifications.filter((n) => getCategory(n.type) === cat);
      return { category: cat, count: filtered.length, notifications: filtered };
    })
    .filter(({ count }) => count > 0);
}

function getCategoryTitle(category: NotificationCategory): string {
  switch (category) {
    case "payment": return "Payment Confirmations";
    case "approval": return "Tenant Approvals";
    case "room_change": return "Room Change Requests";
    case "warning": return "Warnings";
    case "lease": return "Lease Events";
    default: return "Notifications";
  }
}