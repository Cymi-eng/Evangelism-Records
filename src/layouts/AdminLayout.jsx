import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users as UsersIcon,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";

/**
 * DESIGN NOTES
 * ------------
 * Palette
 *   navy          #101B3D   sidebar ground + headings on white
 *   navy-panel    #1B2A5C   raised surface for hover/active rows
 *   white         #FFFFFF   main content ground
 *   red           #E11D2E   primary energy — crest mark, logout, small alerts
 *   electric-blue #2F6FED   interactive accent — active nav state, focus rings, links
 *   slate-muted   #94A3C4   secondary sidebar text
 *
 * Type
 *   Display: 'Fraunces' for the wordmark/page titles — gives it presence
 *            without going full corporate-sans. Add to index.html <head>:
 *              <link rel="preconnect" href="https://fonts.googleapis.com">
 *              <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
 *   Body/UI: Inter throughout the nav and functional chrome.
 *
 * Signature element
 *   The crest mark pairs the two accents directly — an electric-blue arch
 *   with a red core — so the two liveliest colors in the palette meet in one
 *   spot instead of competing across the whole page. Everything else stays
 *   disciplined: red is reserved for "leaving/alerts," blue for "active/here."
 */

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Members", path: "/admin/members", icon: ClipboardList, end: false },
  { label: "Reports", path: "/admin/reports", icon: BarChart3, end: false },
  { label: "Users", path: "/admin/users", icon: UsersIcon, end: false },
];

function CrestMark() {
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg viewBox="0 0 44 44" className="absolute inset-0" aria-hidden="true">
        <defs>
          <linearGradient id="crestGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F6FED" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2F6FED" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M4 40 V20 C4 9 12 3 22 3 C32 3 40 9 40 20 V40"
          fill="url(#crestGlow)"
          stroke="#2F6FED"
          strokeOpacity="0.7"
          strokeWidth="1"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[#E11D2E]" />
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-white flex font-sans">

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#101B3D] border-b-2 border-[#E11D2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-[#2F6FED]/50 bg-[#1B2A5C]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E11D2E]" />
          </div>
          <div className="leading-tight">
            <p className="font-['Fraunces',serif] font-semibold text-white text-[15px] tracking-wide">
              City Mega Church
            </p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#94A3C4]">
              Admin Panel
            </p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-[#94A3C4] hover:text-white hover:bg-white/5 rounded-md transition-colors"
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
        className={`w-72 bg-[#101B3D] flex flex-col fixed h-screen z-50 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-7 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <CrestMark />
            <div>
              <p className="font-['Fraunces',serif] font-semibold text-white text-[17px] leading-tight tracking-wide">
                City Mega Church
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#94A3C4] mt-1">
                Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-[#94A3C4] hover:text-white hover:bg-white/5 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 pb-3 text-[10px] uppercase tracking-[0.2em] text-[#4C5A85] font-medium">
            Menu
          </p>
          {navItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 pl-4 pr-4 py-2.5 rounded-r-sm text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#1B2A5C] text-white"
                    : "text-[#94A3C4] hover:text-white hover:bg-white/[0.04]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-full transition-colors ${
                      isActive ? "bg-[#2F6FED]" : "bg-transparent"
                    }`}
                  />
                  <Icon
                    size={17}
                    className={isActive ? "text-[#2F6FED]" : "text-[#4C5A85] group-hover:text-[#94A3C4]"}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-5 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#1B2A5C] border border-[#2F6FED]/50 flex items-center justify-center text-xs font-semibold text-[#2F6FED] uppercase shrink-0">
              {user?.email ? user.email.charAt(0) : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email}
              </p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#4C5A85]">
                Administrator
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-[#FF8A93] hover:bg-[#E11D2E]/15 hover:text-white transition-colors"
          >
            <LogOut size={17} />
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