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

  const pendingFollowUps = visitors.filter(
    (v) => !v.followUpCompleted
  ).length;

  const completedFollowUps = visitors.filter(
    (v) => v.followUpCompleted
  ).length;

  const totalSheets = sheets.length;

  const stats = [
    {
      label: "Today's Records",
      value: todayCount,
      icon: Clock,
      color: "bg-blue-600",
      loading: loadingVisitors,
    },
    {
      label: "Pending Follow-ups",
      value: pendingFollowUps,
      icon: ClipboardList,
      color: "bg-amber-600",
      loading: loadingVisitors,
    },
    {
      label: "Completed Follow-ups",
      value: completedFollowUps,
      icon: CheckCircle2,
      color: "bg-emerald-600",
      loading: loadingVisitors,
    },
    {
      label: "History",
      value: totalSheets,
      icon: HistoryIcon,
      color: "bg-purple-600",
      loading: loadingSheets,
    },
  ];

  const recentSheets = sheets.slice(0, 5).map((sheet) => {
    const visitorCount = visitors.filter(
      (v) => v.sheetId === sheet.id
    ).length;
    return { ...sheet, visitorCount };
  });

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

      {/* Recent evangelism sheets — row list, no table */}
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
                <div
                  key={sheet.id}
                  className="flex items-center justify-between py-3"
                >
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