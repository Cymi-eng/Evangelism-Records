import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isThisWeek(date, now) {
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

export default function AdminDashboard() {
  const [converts, setConverts] = useState([]);
  const [loadingConverts, setLoadingConverts] = useState(true);

  useEffect(() => {
    const convertsRef = collection(db, "converts");
    const convertsQuery = query(convertsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      convertsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setConverts(data);
        setLoadingConverts(false);
      },
      (error) => {
        console.error("Error loading converts:", error);
        setLoadingConverts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const now = new Date();

  const todayCount = converts.filter((c) => {
    if (!c.createdAt?.toDate) return false;
    return isSameDay(c.createdAt.toDate(), now);
  }).length;

  const weekCount = converts.filter((c) => {
    if (!c.createdAt?.toDate) return false;
    return isThisWeek(c.createdAt.toDate(), now);
  }).length;

  const returningCount = converts.filter(
    (c) => c.status === "returning"
  ).length;

  const leaderCounts = converts.reduce((acc, c) => {
    const key = c.recordedBy || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const leaderBreakdown = Object.entries(leaderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentConverts = converts.slice(0, 8);

  const stats = [
    {
      label: "Total Converts",
      value: converts.length,
      icon: Users,
      color: "bg-blue-600",
    },
    {
      label: "Added Today",
      value: todayCount,
      icon: UserPlus,
      color: "bg-emerald-600",
    },
    {
      label: "This Week",
      value: weekCount,
      icon: CalendarDays,
      color: "bg-amber-600",
    },
    {
      label: "Returning Converts",
      value: returningCount,
      icon: TrendingUp,
      color: "bg-purple-600",
    },
  ];

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Admin Overview
        </h1>
        <p className="text-slate-500 mt-1">
          Church-wide convert records at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${color} p-3 rounded-xl`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {loadingConverts ? "—" : value}
                </p>
                <p className="text-sm text-slate-500">
                  {label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="border-0 shadow-sm rounded-2xl lg:col-span-2">
          <CardContent className="p-6">

            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Recent Converts
            </h2>

            {loadingConverts ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : recentConverts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No converts recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentConverts.map((convert) => (
                  <div
                    key={convert.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {convert.fullName || "Unnamed Convert"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {convert.phone || "No phone provided"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          convert.status === "returning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {convert.status === "returning" ? "Returning" : "New"}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {convert.createdAt?.toDate
                          ? convert.createdAt.toDate().toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">

            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Top Recorders
            </h2>

            {loadingConverts ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : leaderBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500">
                No records yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaderBreakdown.map(([uid, count]) => (
                  <div
                    key={uid}
                    className="flex items-center justify-between py-3"
                  >
                    <p className="text-sm font-medium text-slate-700 truncate max-w-[70%]">
                      {uid === "unknown" ? "Unassigned" : uid}
                    </p>
                    <span className="text-sm font-semibold text-slate-800">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>

      </div>

    </div>
  );
}