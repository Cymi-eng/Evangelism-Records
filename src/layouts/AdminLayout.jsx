import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users as UsersIcon,
  ClipboardList,
  LogOut,
  Church,
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
    <div className="min-h-screen bg-slate-100 flex">

      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-screen">

        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
          <div className="bg-blue-600 p-2 rounded-full">
            <Church className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">
              City Mega Church
            </p>
            <p className="text-xs text-slate-500">
              Admin Panel
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <div className="px-2 mb-3">
            <p className="text-sm font-medium text-slate-800 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </aside>

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>

    </div>
  );
}