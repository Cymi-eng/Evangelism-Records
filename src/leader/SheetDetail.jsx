import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { ArrowLeft, Phone, MapPin } from "lucide-react";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";

export default function SheetDetail() {
  const { sheetId } = useParams();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingSheet, setLoadingSheet] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const loadSheet = async () => {
      try {
        const sheetSnap = await getDoc(doc(db, "evangelismSheets", sheetId));
        if (sheetSnap.exists()) {
          setSheet({ id: sheetSnap.id, ...sheetSnap.data() });
        }
      } catch (error) {
        console.error("Error loading sheet:", error);
      } finally {
        setLoadingSheet(false);
      }
    };

    loadSheet();
  }, [sheetId]);

  useEffect(() => {
    const membersRef = collection(db, "members");
    const membersQuery = query(
      membersRef,
      where("sheetId", "==", sheetId),
      orderBy("createdAt", "asc")
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
  }, [sheetId]);

  return (
    <div className="space-y-6 md:space-y-8">

      <button
        onClick={() => navigate("/leader/history")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        Back to History
      </button>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 break-words">
          {loadingSheet ? "Loading..." : sheet?.groupName || "Unnamed Group"}
        </h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">
          {loadingSheet
            ? ""
            : `${sheet?.date} · ${sheet?.day} · Led by ${sheet?.leaderName}`}
        </p>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-0">

          <h2 className="text-base md:text-lg font-semibold text-slate-800 px-4 md:px-6 pt-4 md:pt-6 mb-4">
            Members Recorded
          </h2>

          {loadingMembers ? (
            <p className="text-sm text-slate-500 px-4 md:px-6 pb-4 md:pb-6">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-500 px-4 md:px-6 pb-4 md:pb-6">
              No members were recorded on this sheet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-4 md:px-6 py-3 whitespace-nowrap">
                      Name
                    </th>
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-3 py-3 whitespace-nowrap">
                      Phone
                    </th>
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-3 py-3 whitespace-nowrap">
                      Address
                    </th>
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-3 py-3 whitespace-nowrap">
                      Salvation
                    </th>
                    <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-4 md:px-6 py-3 whitespace-nowrap">
                      Sunday Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <tr key={member.id} className="align-top">
                      <td className="px-4 md:px-6 py-4">
                        <p className="font-medium text-slate-800 break-words">
                          {member.fullName || "Unnamed Visitor"}
                        </p>
                        {member.prayerRequest && (
                          <p className="text-sm text-slate-400 mt-1.5 italic break-words max-w-xs">
                            "{member.prayerRequest}"
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {member.phone ? (
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <Phone size={13} />
                            {member.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {member.address ? (
                          <span className="flex items-center gap-1.5 text-slate-600 break-words">
                            <MapPin size={13} className="shrink-0" />
                            {member.address}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            member.acceptedJesus === "Yes"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {member.acceptedJesus === "Yes"
                            ? "Accepted Jesus"
                            : "Not Yet"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            member.willCome === "Yes"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {member.willCome === "Yes" ? "Coming Sunday" : "Not Confirmed"}
                        </span>
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