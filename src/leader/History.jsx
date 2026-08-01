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
  const [members, setMembers] = useState([]);
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

  // Used only to compute per-sheet member counts
  useEffect(() => {
    if (!user?.uid) return;

    const membersRef = collection(db, "members");
    const membersQuery = query(
      membersRef,
      where("leaderId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setMembers(data);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const sheetsWithCounts = sheets.map((sheet) => ({
    ...sheet,
    memberCount: members.filter((m) => m.sheetId === sheet.id).length,
  }));

  return (
    <div className="space-y-6 md:space-y-8">

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
          History
        </h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">
          Your past evangelism sheets.
        </p>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-0">

          {loading ? (
            <p className="text-sm text-slate-500 p-4 md:p-6">Loading...</p>
          ) : sheetsWithCounts.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 md:p-6">
              No evangelism sheets recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-4 md:px-6 py-3 whitespace-nowrap">
                      Group
                    </th>
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-3 py-3 whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-3 py-3 whitespace-nowrap">
                      Day
                    </th>
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-3 py-3 whitespace-nowrap">
                      Members
                    </th>
                    <th className="text-right font-medium text-[11px] uppercase tracking-wide text-slate-400 px-4 md:px-6 py-3 whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheetsWithCounts.map((sheet) => (
                    <tr key={sheet.id}>
                      <td className="px-4 md:px-6 py-4">
                        <p className="font-medium text-slate-800 break-words">
                          {sheet.groupName || "Unnamed Group"}
                        </p>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-slate-600">
                        {sheet.date}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {sheet.day}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Users size={13} />
                          {sheet.memberCount}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/leader/history/${sheet.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          View
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
}