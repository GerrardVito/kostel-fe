import { useState } from "react";
import { User, Notification } from "../types";
import { LayoutGrid, LogOut, ChevronDown, Bell } from "lucide-react";

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  role: "tenant" | "owner" | "admin";
  notifications?: Notification[];
  unreadCount?: number;
}

export default function Header({
  currentUser,
  onLogout,
  role,
  notifications = [],
  unreadCount = 0,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const initials = currentUser
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="w-full sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-lg text-primary">
            <LayoutGrid className="h-6 w-6 font-semibold" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">KOSTEL</h1>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 ml-1">
            {role}
          </span>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotif(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-20 py-2 max-h-[400px] overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-display font-bold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-primary">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400 text-xs">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.notification_id}
                        className={`px-4 py-2 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${
                          !n.is_read ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-900">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* User Info & Avatar Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 pl-2 border-l border-slate-200 cursor-pointer"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="font-sans text-sm font-semibold text-slate-900">
                    {currentUser.name}
                  </span>
                  <span className="font-sans text-xs text-slate-500 capitalize">{role}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-sm text-primary border-2 border-slate-200">
                  {initials}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{currentUser.email}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{role} account</p>
                    </div>
                    <button
                      onClick={() => { setShowMenu(false); onLogout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
