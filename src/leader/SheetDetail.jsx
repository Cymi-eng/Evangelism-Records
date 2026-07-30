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
  const [visitors, setVisitors] = useState([]);
  const [loadingSheet, setLoadingSheet] = useState(true);
  const [loadingVisitors, setLoadingVisitors] = useState(true);

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
    const visitorsRef = collection(db, "visitors");
    const visitorsQuery = query(
      visitorsRef,
      where("sheetId", "==", sheetId),
      orderBy("createdAt", "asc")
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
        <CardContent className="p-4 md:p-6">

          <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4">
            Visitors Recorded
          </h2>

          {loadingVisitors ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : visitors.length === 0 ? (
            <p className="text-sm text-slate-500">
              No visitors were recorded on this sheet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {visitors.map((visitor) => (
                <div key={visitor.id} className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="font-medium text-slate-800 break-words min-w-0">
                      {visitor.fullName || "Unnamed Visitor"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          visitor.acceptedJesus === "Yes"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {visitor.acceptedJesus === "Yes"
                          ? "Accepted Jesus"
                          : "Not Yet"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          visitor.willCome === "Yes"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {visitor.willCome === "Yes" ? "Coming Sunday" : "Not Confirmed"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                    {visitor.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} />
                        {visitor.phone}
                      </span>
                    )}
                    {visitor.address && (
                      <span className="flex items-center gap-1.5 break-words">
                        <MapPin size={13} className="shrink-0" />
                        {visitor.address}
                      </span>
                    )}
                  </div>

                  {visitor.prayerRequest && (
                    <p className="text-sm text-slate-400 mt-1.5 italic break-words">
                      "{visitor.prayerRequest}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
}