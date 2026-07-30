import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Users, ChevronRight, CalendarDays } from "lucide-react";

import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sheets, setSheets] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      },
      (error) => {
        console.error("Error loading history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Used only to compute per-sheet visitor counts
  useEffect(() => {
    if (!user?.uid) return;

    const visitorsRef = collection(db, "visitors");
    const visitorsQuery = query(
      visitorsRef,
      where("leaderId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(visitorsQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setVisitors(data);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const sheetsWithCounts = sheets.map((sheet) => ({
    ...sheet,
    visitorCount: visitors.filter((v) => v.sheetId === sheet.id).length,
  }));

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          History
        </h1>
        <p className="text-slate-500 mt-1">
          Your past evangelism sheets.
        </p>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : sheetsWithCounts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No evangelism sheets recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sheetsWithCounts.map((sheet) => (
                <div
                  key={sheet.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {sheet.groupName || "Unnamed Group"}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                      <CalendarDays size={14} />
                      {sheet.date} · {sheet.day}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Users size={14} />
                      {sheet.visitorCount} visitor{sheet.visitorCount === 1 ? "" : "s"}
                    </div>

                    <button
                      onClick={() => navigate(`/leader/history/${sheet.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      View
                      <ChevronRight size={14} />
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