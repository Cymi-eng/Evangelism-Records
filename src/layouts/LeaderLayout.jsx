import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  History as HistoryIcon,
  FilePlus,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Building2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";

/**
 * DESIGN NOTES
 * ------------
 * Matches the reference mockup: a near-black navy sidebar, a single blue
 * accent for "active/here," and a white content area with its own header
 * bar (page title + notifications + account). This trades the earlier
 * bespoke palette for a more standard, familiar SaaS-dashboard read, per
 * the reference.
 *
 * Palette
 *   ink       #0B1220   sidebar ground
 *   ink-panel #16213A   raised surface for hover rows
 *   white     #FFFFFF   main content ground
 *   blue      #2563EB   active nav, primary actions, focus rings
 *   slate     #94A3B8   secondary sidebar text
 *   border    #E5E7EB   hairlines in the content header
 *
 * Type: Inter throughout — the mockup's UI type is a plain, neutral
 * grotesque, so a display face would fight the reference rather than
 * match it.
 */

const navItems = [
  { label: "Dashboard", path: "/leader", icon: LayoutDashboard, end: true },
  { label: "New Evangelism Sheet", path: "/leader/new-sheet", icon: FilePlus, end: false },
  { label: "Evangelism History", path: "/leader/history", icon: HistoryIcon, end: false },
  { label: "Follow-ups", path: "/leader/follow-ups", icon: ClipboardList, end: false },
];

const pageTitles = {
  "/leader": "Dashboard",
  "/leader/new-sheet": "New Evangelism Sheet",
  "/leader/history": "Evangelism History",
  "/leader/follow-ups": "Follow-ups",
};

export default function LeaderLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully.");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to log out.");
    }
  };

  const currentTitle =
    pageTitles[location.pathname] ??
    navItems.find((item) => location.pathname.startsWith(item.path))?.label ??
    "Dashboard";

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : "L";

  return (
    <div className="min-h-screen bg-white flex font-sans">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-64 bg-[#0B1220] flex flex-col fixed h-screen z-50 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-white text-[14px]">
                City Mega Church
              </p>
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
                Evangelism Records
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-[#94A3B8] hover:text-white hover:bg-white/5 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#2563EB] text-white"
                    : "text-[#94A3B8] hover:text-white hover:bg-white/[0.06]"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-5 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">

        {/* Content header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border-b border-[#E5E7EB] px-4 lg:px-8 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-[15px] lg:text-base font-semibold text-slate-900 truncate">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <button
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-medium text-slate-800 truncate max-w-[140px]">
                    {user?.email ?? "Leader"}
                  </p>
                  <p className="text-[10px] text-slate-500">Group Leader</p>
                </div>
                <ChevronDown size={14} className="hidden sm:block text-slate-400" />
              </button>

              {accountOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-40 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}