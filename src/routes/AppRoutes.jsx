import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

import Login from "@/auth/Login";
import Register from "@/auth/Register";

import LeaderLayout from "@/layouts/LeaderLayout";
import LeaderDashboard from "@/leader/Dashboard";
import NewSheet from "@/leader/NewSheet";
import FollowUps from "@/leader/FollowUps";
import History from "@/leader/History";
import SheetDetail from "@/leader/SheetDetail";

import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import Members from "@/pages/admin/Members";
import Users from "@/pages/admin/Users";

export default function AppRoutes() {
  const { user, role, loading } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/"
        element={
          loading ? null : !user ? (
            <Login />
          ) : role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : role === "leader" ? (
            <Navigate to="/leader" replace />
          ) : (
            // User is authenticated but has no recognized role.
            // Do NOT navigate here — navigating would re-trigger this
            // same check and create an infinite redirect loop.
            <div className="flex items-center justify-center min-h-screen text-center px-4">
              <div>
                <p className="mb-2">No role is assigned to this account.</p>
                <p className="text-sm text-gray-500">
                  Contact an administrator to get access.
                </p>
              </div>
            </div>
          )
        }
      />

      {/* Register */}
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/" replace />}
      />

      {/* Leader */}
      <Route
        path="/leader"
        element={
          loading ? null : user && role === "leader" ? (
            <LeaderLayout />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route index element={<LeaderDashboard />} />
        <Route path="new-sheet" element={<NewSheet />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="history" element={<History />} />
        <Route path="history/:sheetId" element={<SheetDetail />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          loading ? null : user && role === "admin" ? (
            <AdminLayout />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="users" element={<Users />} />
      </Route>

      {/* Unknown Routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}