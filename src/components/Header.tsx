import { useState } from "react";
import { User } from "../types";
import { LayoutGrid, LogOut, ChevronDown } from "lucide-react";

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  role: "tenant" | "owner";
}

export default function Header({ currentUser, onLogout, role }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
          {/* User Info & Avatar Dropdown */}
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
        </div>
      </div>
    </header>
  );
}
