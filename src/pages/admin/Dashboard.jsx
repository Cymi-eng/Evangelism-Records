import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Sparkles,
  CalendarCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";

// Aligned with AdminLayout's palette: navy + white + red + electric blue.
const NAVY = "#101B3D";
const NAVY_PANEL = "#1B2A5C";
const BLUE_LIGHT = "#2F6FED"; // electric blue — was #5B8DEF
const RED = "#E11D2E"; // was #B42D3A

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
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

const STATUS_COLORS = {
  "Still Following Up": "#94a3b8",
  "Called": BLUE_LIGHT,
  "Visited": "#a855f7",
  "Came to Church": "#10b981",
  "Not Reachable": RED,
  "Attended Church": "#10b981",
  "Transferred to Discipleship": "#d97706",
};

export default function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(true);

  useEffect(() => {
    const membersRef = collection(db, "members");
    const membersQuery = query(membersRef, orderBy("createdAt", "desc"));

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
  }, []);

  useEffect(() => {
    const sheetsRef = collection(db, "evangelismSheets");

    const unsubscribe = onSnapshot(
      sheetsRef,
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
  }, []);

  const sheetsById = useMemo(() => {
    const map = {};
    sheets.forEach((sheet) => {
      map[sheet.id] = sheet;
    });
    return map;
  }, [sheets]);

  const loading = loadingMembers || loadingSheets;

  const totalMembers = members.length;
  const acceptedJesus = members.filter((m) => m.acceptedJesus === "Yes").length;
  const promisedToCome = members.filter((m) => m.willCome === "Yes").length;
  const completedFollowUps = members.filter((m) => m.followUpCompleted).length;
  const pendingFollowUps = totalMembers - completedFollowUps;

  const stats = [
    { label: "Total Souls", value: totalMembers, icon: Users },
    { label: "Accepted Jesus", value: acceptedJesus, icon: Sparkles, accent: BLUE_LIGHT },
    { label: "Promised to Come", value: promisedToCome, icon: CalendarCheck },
    { label: "Completed Follow-ups", value: completedFollowUps, icon: CheckCircle2 },
    { label: "Pending Follow-ups", value: pendingFollowUps, icon: Clock, accent: RED },
  ];

  const recentMembers = members.slice(0, 8);

  // --- Weekly members (custom bar column, no chart library) ---

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
  const maxDaily = Math.max(...dailyData.map((d) => d.members), 1);
  const weekTotal = dailyData.reduce((sum, d) => sum + d.members, 0);

  // --- Accepted Jesus (progress ring, no pie chart) ---

  const acceptedPct =
    totalMembers === 0 ? 0 : Math.round((acceptedJesus / totalMembers) * 100);
  const ringRadius = 52;
  const circumference = 2 * Math.PI * ringRadius;
  const ringDash = (acceptedPct / 100) * circumference;

  // --- Follow-up status (stacked ledger bar, no chart library) ---

  const statusCounts = members.reduce((acc, m) => {
    const key = m.followUpStatus || "Still Following Up";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // --- Top leaders (ranked ledger, no chart library) ---

  const leaderCounts = members.reduce((acc, m) => {
    const sheet = sheetsById[m.sheetId];
    const name = sheet?.leaderName || "Unknown Leader";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const leaderData = Object.entries(leaderCounts)
    .map(([leaderName, count]) => ({ leaderName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const maxLeaderCount = Math.max(...leaderData.map((l) => l.count), 1);

  return (
    <div className="space-y-8">

      <div>
        <h1 className="font-['Fraunces',serif] text-2xl font-semibold" style={{ color: NAVY }}>
          Admin Overview
        </h1>
        <p className="text-slate-500 mt-1">
          Church-wide evangelism records at a glance.
        </p>
      </div>

      {/* Stats — report-style figures, not colored icon tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <Card
            key={label}
            className="border border-slate-200 shadow-none rounded-md"
            style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                  {label}
                </p>
                <Icon size={16} className="text-slate-400" />
              </div>
              <p className="font-['Fraunces',serif] text-3xl font-semibold tabular-nums" style={{ color: NAVY }}>
                {loading ? "—" : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1 — weekly bars + accepted ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="border border-slate-200 shadow-none rounded-md lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-['Fraunces',serif] text-lg font-semibold" style={{ color: NAVY }}>
                Souls Recorded — Last 7 Days
              </h2>
              <p className="text-sm text-slate-500 tabular-nums">
                {loading ? "" : `${weekTotal} total`}
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <div className="flex items-end gap-3 border-b border-slate-200 pb-3" style={{ height: 190 }}>
                {dailyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                      {d.members}
                    </span>
                    <div
                      className="w-full max-w-[28px] rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max((d.members / maxDaily) * 130, 4)}px`,
                        backgroundColor: i === dailyData.length - 1 ? RED : BLUE_LIGHT,
                      }}
                    />
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-md">
          <CardContent className="p-6 flex flex-col items-center">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold self-start mb-6" style={{ color: NAVY }}>
              Accepted Jesus
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : totalMembers === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <>
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 140 140" className="w-40 h-40 -rotate-90">
                    <circle
                      cx="70"
                      cy="70"
                      r={ringRadius}
                      stroke="#e2e8f0"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={ringRadius}
                      stroke={BLUE_LIGHT}
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${ringDash} ${circumference}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-['Fraunces',serif] text-3xl font-semibold tabular-nums" style={{ color: NAVY }}>
                      {acceptedPct}%
                    </span>
                  </div>
                </div>

                <div className="w-full mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BLUE_LIGHT }} />
                      Accepted
                    </span>
                    <span className="font-medium text-slate-800 tabular-nums">{acceptedJesus}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      Not Yet
                    </span>
                    <span className="font-medium text-slate-800 tabular-nums">
                      {totalMembers - acceptedJesus}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Row 2 — status ledger + leaders ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="border border-slate-200 shadow-none rounded-md">
          <CardContent className="p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold mb-5" style={{ color: NAVY }}>
              Follow-up Status Breakdown
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : statusData.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <>
                <div className="w-full h-3 rounded-full overflow-hidden flex mb-5">
                  {statusData.map((entry) => (
                    <div
                      key={entry.status}
                      style={{
                        width: `${(entry.count / totalMembers) * 100}%`,
                        backgroundColor: STATUS_COLORS[entry.status] || "#94a3b8",
                      }}
                    />
                  ))}
                </div>

                <div className="divide-y divide-slate-100">
                  {statusData.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2.5 text-sm text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[entry.status] || "#94a3b8" }}
                        />
                        {entry.status}
                      </span>
                      <span className="text-sm text-slate-500 tabular-nums">
                        {entry.count} · {Math.round((entry.count / totalMembers) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-md">
          <CardContent className="p-6">
            <h2 className="font-['Fraunces',serif] text-lg font-semibold mb-5" style={{ color: NAVY }}>
              Top Leaders by Souls Recorded
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : leaderData.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {leaderData.map((leader, index) => (
                  <div key={leader.leaderName}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2.5 text-sm text-slate-700">
                        <span className="font-['Fraunces',serif] text-xs text-slate-400 tabular-nums w-4">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {leader.leaderName}
                      </span>
                      <span className="text-sm font-medium text-slate-800 tabular-nums">
                        {leader.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-6">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(leader.count / maxLeaderCount) * 100}%`,
                          backgroundColor: index === 0 ? RED : BLUE_LIGHT,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Recent members */}
      <Card className="border border-slate-200 shadow-none rounded-md">
        <CardContent className="p-6">

          <h2 className="font-['Fraunces',serif] text-lg font-semibold mb-4" style={{ color: NAVY }}>
            Recent Souls Recorded
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : recentMembers.length === 0 ? (
            <p className="text-sm text-slate-500">
              No Souls recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {member.fullName || "Unnamed Visitor"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {member.phone || "No phone provided"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        member.acceptedJesus === "Yes"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {member.acceptedJesus === "Yes" ? "Accepted" : "Not Yet"}
                    </span>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={
                        member.followUpCompleted
                          ? { backgroundColor: `${BLUE_LIGHT}1A`, color: BLUE_LIGHT }
                          : { backgroundColor: `${RED}1A`, color: RED }
                      }
                    >
                      {member.followUpCompleted ? "Completed" : "Pending"}
                    </span>
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