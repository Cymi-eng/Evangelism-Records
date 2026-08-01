import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  History as HistoryIcon,
  PlusCircle,
  Users,
  ArrowRight,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

/**
 * DESIGN NOTES
 * ------------
 * Carries the layout's system through to the dashboard: blue (#2563EB) as
 * the single accent, soft-tinted icon badges instead of solid color
 * blocks, hairline borders over heavy shadows, and a line/area chart for
 * the 7-day trend since a trend is a continuous story, not discrete bars.
 * All icons are stock lucide-react — no bespoke marks on this page.
 */

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

const ACCEPTED_COLORS = ["#2563eb", "#dc2626"];
const STATUS_COLORS = {
  "Still Following Up": "#94a3b8",
  "Called": "#3b82f6",
  "Visited": "#7c3aed",
  "Came to Church": "#059669",
  "Not Reachable": "#dc2626",
  "Attended Church": "#059669",
  "Transferred to Discipleship": "#d97706",
};

export default function LeaderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const membersRef = collection(db, "members");
    const membersQuery = query(
      membersRef,
      where("leaderId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setMembers(data);
        setLoadingMembers(false);
      },
      (error) => {
        console.error("Error loading members:", error);
        setLoadingMembers(false);
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

  const todayCount = members.filter((m) => {
    if (!m.createdAt?.toDate) return false;
    return isSameDay(m.createdAt.toDate(), now);
  }).length;

  const pendingFollowUps = members.filter((m) => !m.followUpCompleted).length;
  const completedFollowUps = members.filter((m) => m.followUpCompleted).length;
  const totalSheets = sheets.length;

  const stats = [
    {
      label: "Today's Records",
      value: todayCount,
      icon: Clock,
      tint: "bg-blue-50 text-blue-600",
      loading: loadingMembers,
    },
    {
      label: "Pending Follow-ups",
      value: pendingFollowUps,
      icon: ClipboardList,
      tint: "bg-amber-50 text-amber-600",
      loading: loadingMembers,
    },
    {
      label: "Completed Follow-ups",
      value: completedFollowUps,
      icon: CheckCircle2,
      tint: "bg-emerald-50 text-emerald-600",
      loading: loadingMembers,
    },
    {
      label: "Evangelism Sheets",
      value: totalSheets,
      icon: HistoryIcon,
      tint: "bg-violet-50 text-violet-600",
      loading: loadingSheets,
    },
  ];

  const recentSheets = sheets.slice(0, 5).map((sheet) => ({
    ...sheet,
    memberCount: members.filter((m) => m.sheetId === sheet.id).length,
  }));

  // --- Chart data ---

  const last7Days = getLastNDays(7);
  const dailyData = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const count = members.filter((m) => {
      if (!m.createdAt?.toDate) return false;
      const created = m.createdAt.toDate();
      return created >= day && created < nextDay;
    }).length;
    return { day: formatDayLabel(day), members: count };
  });

  const acceptedCount = members.filter((m) => m.acceptedJesus === "Yes").length;
  const notAcceptedCount = members.length - acceptedCount;
  const acceptedData = [
    { name: "Accepted Jesus", value: acceptedCount },
    { name: "Not Yet", value: notAcceptedCount },
  ];

  const statusCounts = members.reduce((acc, m) => {
    const key = m.followUpStatus || "Still Following Up";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
            Follow-ups
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, tint, loading }) => (
          <Card key={label} className="border border-slate-200 shadow-none rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${tint} w-11 h-11 rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold text-slate-900 leading-none">
                  {loading ? "—" : value}
                </p>
                <p className="text-sm text-slate-500 mt-1.5 truncate">
                  {label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Card className="border border-slate-200 shadow-none rounded-xl lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Members Recorded — Last 7 Days
            </h2>

            {loadingMembers ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="membersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="members"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#membersFill)"
                      dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Accepted Jesus
            </h2>

            {loadingMembers ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : members.length === 0 ? (
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
                        <Cell key={entry.name} fill={ACCEPTED_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
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
      <Card className="border border-slate-200 shadow-none rounded-xl">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Follow-up Status Breakdown
          </h2>

          {loadingMembers ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : statusData.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={statusData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={160}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
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
      <Card className="border border-slate-200 shadow-none rounded-xl">
        <CardContent className="p-6">

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Evangelism Sheets
            </h2>
            <button
              onClick={() => navigate("/leader/history")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          {loadingSheets ? (
            <p className="text-sm text-slate-500 py-3">Loading…</p>
          ) : recentSheets.length === 0 ? (
            <p className="text-sm text-slate-500 py-3">
              No evangelism sheets recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSheets.map((sheet) => (
                <div key={sheet.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {sheet.groupName || "Unnamed Group"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {sheet.date} · {sheet.day}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 shrink-0 ml-3">
                    <Users size={14} />
                    {sheet.memberCount} member{sheet.memberCount === 1 ? "" : "s"}
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