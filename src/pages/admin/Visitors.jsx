import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Search, Trash2, Phone } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const visitorsRef = collection(db, "visitors");
    const visitorsQuery = query(visitorsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      visitorsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setVisitors(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading visitors:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this visitor record? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteDoc(doc(db, "visitors", id));
      toast.success("Visitor record deleted.");
    } catch (error) {
      console.error("Error deleting visitor:", error);
      toast.error("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      visitor.fullName?.toLowerCase().includes(term) ||
      visitor.phone?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || visitor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filters = [
    { label: "All", value: "all" },
    { label: "New", value: "new" },
    { label: "Returning", value: "returning" },
  ];

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          All Visitors
        </h1>
        <p className="text-slate-500 mt-1">
          Church-wide visitor records, across all leaders.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">

        <div className="relative max-w-sm w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="text"
            placeholder="Search by name or phone..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {filters.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : filteredVisitors.length === 0 ? (
            <p className="text-sm text-slate-500">
              No visitors match your search.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredVisitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {visitor.fullName || "Unnamed Visitor"}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                      <Phone size={14} />
                      {visitor.phone || "No phone provided"}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            visitor.status === "returning"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {visitor.status === "returning" ? "Returning" : "New"}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            visitor.followedUp
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {visitor.followedUp ? "Followed Up" : "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {visitor.createdAt?.toDate
                          ? visitor.createdAt.toDate().toLocaleDateString()
                          : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(visitor.id)}
                      disabled={deletingId === visitor.id}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete visitor"
                    >
                      <Trash2 size={16} />
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