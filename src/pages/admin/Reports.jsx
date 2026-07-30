import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";

function getLastNDays(n) {
  const days = [];
  const now = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  return days;
}

function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Reports() {
  const [converts, setConverts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      },
      (error) => {
        console.error("Error loading report data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const last7Days = getLastNDays(7);

  const dailyData = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const count = converts.filter((c) => {
      if (!c.createdAt?.toDate) return false;
      const created = c.createdAt.toDate();
      return created >= day && created < nextDay;
    }).length;

    return {
      day: formatDayLabel(day),
      converts: count,
    };
  });

  const totalConverts = converts.length;
  const newConverts = converts.filter((c) => c.status === "new").length;
  const returningConverts = converts.filter(
    (c) => c.status === "returning"
  ).length;
  const followedUp = converts.filter((c) => c.followedUp).length;
  const pendingFollowUp = totalConverts - followedUp;

  const followUpRate =
    totalConverts > 0
      ? Math.round((followedUp / totalConverts) * 100)
      : 0;

  const summaryStats = [
    { label: "New Converts", value: newConverts },
    { label: "Returning Converts", value: returningConverts },
    { label: "Pending Follow-Ups", value: pendingFollowUp },
    { label: "Follow-Up Rate", value: `${followUpRate}%` },
  ];

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Reports
        </h1>
        <p className="text-slate-500 mt-1">
          Convert trends over the last 7 days.
        </p>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">

          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Converts Per Day
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar
                    dataKey="converts"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map(({ label, value }) => (
          <Card key={label} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-slate-800">
                {loading ? "—" : value}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}