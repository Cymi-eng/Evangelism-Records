import { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Search, Phone, MapPin, ChevronDown } from "lucide-react";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(true);

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [leaderFilter, setLeaderFilter] = useState("all");

  useEffect(() => {
    const visitorsRef = collection(db, "visitors");
    const visitorsQuery = query(visitorsRef, orderBy("createdAt", "desc"));

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
  }, []);

  // Sheets are needed to resolve sheetId -> day/leaderName/groupName for filtering
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

  const leaderNames = useMemo(() => {
    const names = new Set();
    sheets.forEach((sheet) => {
      if (sheet.leaderName) names.add(sheet.leaderName);
    });
    return Array.from(names).sort();
  }, [sheets]);

  const enrichedVisitors = useMemo(() => {
    return visitors.map((visitor) => {
      const sheet = sheetsById[visitor.sheetId];
      return {
        ...visitor,
        groupName: sheet?.groupName || "Unknown Group",
        day: sheet?.day || null,
        date: sheet?.date || null,
        leaderName: sheet?.leaderName || "Unknown Leader",
      };
    });
  }, [visitors, sheetsById]);

  const filteredVisitors = enrichedVisitors.filter((visitor) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      visitor.fullName?.toLowerCase().includes(term) ||
      visitor.phone?.toLowerCase().includes(term);

    const matchesDay = dayFilter === "all" || visitor.day === dayFilter;

    const matchesMonth =
      monthFilter === "all" ||
      (visitor.date &&
        MONTHS[new Date(visitor.date).getMonth()] === monthFilter);

    const matchesLeader =
      leaderFilter === "all" || visitor.leaderName === leaderFilter;

    return matchesSearch && matchesDay && matchesMonth && matchesLeader;
  });

  const loading = loadingVisitors || loadingSheets;

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          All Visitors
        </h1>
        <p className="text-slate-500 mt-1">
          Church-wide visitor records, across all leaders.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

        <div className="relative max-w-sm w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="text"
            placeholder="Search by name or phone..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">

          <div className="relative">
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="appearance-none h-11 pl-3 pr-8 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Days</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="appearance-none h-11 pl-3 pr-8 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Months</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={leaderFilter}
              onChange={(e) => setLeaderFilter(e.target.value)}
              className="appearance-none h-11 pl-3 pr-8 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Leaders</option>
              {leaderNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

        </div>

      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : filteredVisitors.length === 0 ? (
            <p className="text-sm text-slate-500">
              No visitors match your filters.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredVisitors.map((visitor) => (
                <div key={visitor.id} className="py-4">

                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-slate-800">
                        {visitor.fullName || "Unnamed Visitor"}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                        {visitor.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} />
                            {visitor.phone}
                          </span>
                        )}
                        {visitor.address && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} />
                            {visitor.address}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {visitor.groupName} · {visitor.date} ({visitor.day}) · Led by {visitor.leaderName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          visitor.acceptedJesus === "Yes"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {visitor.acceptedJesus === "Yes" ? "Accepted Jesus" : "Not Yet"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          visitor.willCome === "Yes"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {visitor.willCome === "Yes" ? "Coming Sunday" : "Not Confirmed"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          visitor.followUpCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {visitor.followUpCompleted ? "Follow-up Done" : visitor.followUpStatus || "Pending"}
                      </span>
                    </div>
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