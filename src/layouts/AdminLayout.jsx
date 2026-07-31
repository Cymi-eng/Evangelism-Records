import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users as UsersIcon,
  ClipboardList,
  LogOut,
  Church,
  Menu,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Converts",
    path: "/admin/converts",
    icon: ClipboardList,
    end: false,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: BarChart3,
    end: false,
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: UsersIcon,
    end: false,
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#12151C] border-b-2 border-[#B42D3A] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-white/20 rounded-sm">
            <Church className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-serif font-semibold text-white text-sm tracking-wide">
              City Mega Church
            </p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              Admin Panel
            </p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-slate-300 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-72 bg-[#12151C] flex flex-col fixed h-screen z-50 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >

        <div className="flex items-center justify-between gap-3 px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-sm">
              <Church className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-serif font-semibold text-white leading-tight tracking-wide">
                City Mega Church
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">
                Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Menu
          </p>
          {navItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 pl-4 pr-4 py-2.5 border-l-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#B42D3A] bg-[#1B2A4E] text-white"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={isActive ? "text-[#5B8DEF]" : "text-slate-500 group-hover:text-slate-300"}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#1B2A4E] border border-white/10 flex items-center justify-center text-xs font-semibold text-[#5B8DEF] uppercase shrink-0">
              {user?.email ? user.email.charAt(0) : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Administrator
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-[#E8626D] hover:bg-[#B42D3A]/10 hover:text-[#FF7A85] transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </aside>

      <main className="flex-1 md:ml-72 p-4 md:p-8 pt-20 md:pt-8">
        <Outlet />
      </main>

    </div>
  );
}