import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  History as HistoryIcon,
  PlusCircle,
  Users,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const PIE_COLORS = ["#2563eb", "#e2e8f0"];
const STATUS_COLORS = {
  "Still Following Up": "#94a3b8",
  "Called": "#3b82f6",
  "Visited": "#a855f7",
  "Came to Church": "#10b981",
  "Not Reachable": "#ef4444",
  "Attended Church": "#10b981",
  "Transferred to Discipleship": "#f59e0b",
};

export default function LeaderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const visitorsRef = collection(db, "visitors");
    const visitorsQuery = query(
      visitorsRef,
      where("leaderId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      visitorsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setVisitors(data);
        setLoadingVisitors(false);
      },
      (error) => {
        console.error("Error loading visitors:", error);
        setLoadingVisitors(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const sheetsRef = collection(db, "evangelismSheets");
    const sheetsQuery = query(
      sheetsRef,
      where("leaderId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      sheetsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSheets(data);
        setLoadingSheets(false);
      },
      (error) => {
        console.error("Error loading sheets:", error);
        setLoadingSheets(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const now = new Date();

  const todayCount = visitors.filter((v) => {
    if (!v.createdAt?.toDate) return false;
    return isSameDay(v.createdAt.toDate(), now);
  }).length;

  const pendingFollowUps = visitors.filter((v) => !v.followUpCompleted).length;
  const completedFollowUps = visitors.filter((v) => v.followUpCompleted).length;
  const totalSheets = sheets.length;

  const stats = [
    { label: "Today's Records", value: todayCount, icon: Clock, color: "bg-blue-600", loading: loadingVisitors },
    { label: "Pending Follow-ups", value: pendingFollowUps, icon: ClipboardList, color: "bg-amber-600", loading: loadingVisitors },
    { label: "Completed Follow-ups", value: completedFollowUps, icon: CheckCircle2, color: "bg-emerald-600", loading: loadingVisitors },
    { label: "History", value: totalSheets, icon: HistoryIcon, color: "bg-purple-600", loading: loadingSheets },
  ];

  const recentSheets = sheets.slice(0, 5).map((sheet) => ({
    ...sheet,
    visitorCount: visitors.filter((v) => v.sheetId === sheet.id).length,
  }));

  // --- Chart data ---

  const last7Days = getLastNDays(7);
  const dailyData = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const count = visitors.filter((v) => {
      if (!v.createdAt?.toDate) return false;
      const created = v.createdAt.toDate();
      return created >= day && created < nextDay;
    }).length;
    return { day: formatDayLabel(day), visitors: count };
  });

  const acceptedCount = visitors.filter((v) => v.acceptedJesus === "Yes").length;
  const notAcceptedCount = visitors.length - acceptedCount;
  const acceptedData = [
    { name: "Accepted Jesus", value: acceptedCount },
    { name: "Not Yet", value: notAcceptedCount },
  ];

  const statusCounts = visitors.reduce((acc, v) => {
    const key = v.followUpStatus || "Still Following Up";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-slate-500 mt-1">
            Here's an overview of your evangelism records.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate("/leader/new-sheet")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={16} />
            New Evangelism Sheet
          </button>
          <button
            onClick={() => navigate("/leader/follow-ups")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ClipboardList size={16} />
            Follow Ups
          </button>
          <button
            onClick={() => navigate("/leader/history")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <HistoryIcon size={16} />
            History
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, loading }) => (
          <Card key={label} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${color} p-3 rounded-xl`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {loading ? "—" : value}
                </p>
                <p className="text-sm text-slate-500">
                  {label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="border-0 shadow-sm rounded-2xl lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Visitors Recorded — Last 7 Days
            </h2>

            {loadingVisitors ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="visitors" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Accepted Jesus
            </h2>

            {loadingVisitors ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : visitors.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={acceptedData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {acceptedData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Follow-up status breakdown */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Follow-up Status Breakdown
          </h2>

          {loadingVisitors ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : statusData.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={160}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent evangelism sheets */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Recent Evangelism Sheets
            </h2>
            <button
              onClick={() => navigate("/leader/history")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>

          {loadingSheets ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : recentSheets.length === 0 ? (
            <p className="text-sm text-slate-500">
              No evangelism sheets recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSheets.map((sheet) => (
                <div key={sheet.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {sheet.groupName || "Unnamed Group"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {sheet.date} · {sheet.day}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users size={14} />
                    {sheet.visitorCount} visitor{sheet.visitorCount === 1 ? "" : "s"}
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