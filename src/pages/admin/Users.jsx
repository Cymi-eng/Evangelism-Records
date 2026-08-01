import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Search, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "leader" : "admin";

    const confirmed = window.confirm(
      `Change this user's role to "${newRole}"?`
    );
    if (!confirmed) return;

    try {
      setUpdatingId(userId);
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Role updated to ${newRole}.`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      u.fullName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 md:space-y-8">

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
          Users
        </h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">
          Manage leader and admin accounts.
        </p>
      </div>

      <div className="relative max-w-sm w-full">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          type="text"
          placeholder="Search by name or email..."
          className="pl-9 h-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4 md:p-6">

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-slate-500">
              No users match your search.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-full shrink-0 ${
                        u.role === "admin" ? "bg-blue-100" : "bg-slate-100"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <ShieldCheck size={18} className="text-blue-600" />
                      ) : (
                        <UserIcon size={18} className="text-slate-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {u.fullName || "Unnamed User"}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {u.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${
                        u.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.role || "unknown"}
                    </span>

                    <button
                      onClick={() => toggleRole(u.id, u.role)}
                      disabled={updatingId === u.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {updatingId === u.id
                        ? "Updating..."
                        : `Make ${u.role === "admin" ? "Leader" : "Admin"}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
}