import { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Search, Phone, MapPin, ChevronDown, MessageCircleHeart } from "lucide-react";

import { db } from "@/config/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * DESIGN NOTES
 * ------------
 * Renamed from "Visitors" to "Members" to match the Firestore collection
 * rename (visitors -> members). This is the admin-wide view: every record
 * any leader has captured, with every field the "Record Members" form
 * collects — name, phone, address, prayer request, accepted-Jesus status,
 * Sunday attendance, and follow-up status — plus which leader/group/date
 * it came from. Row/list layout, not a table, consistent with the rest of
 * the app. Each status pill carries a small uppercase caption above it
 * (Salvation / Attendance / Follow-up) so the pill's meaning is clear at
 * a glance instead of reading as an unlabeled cluster of tags.
 */

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Members() {
  const [members, setMembers] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(true);

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [leaderFilter, setLeaderFilter] = useState("all");

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

  const enrichedMembers = useMemo(() => {
    return members.map((member) => {
      const sheet = sheetsById[member.sheetId];
      return {
        ...member,
        groupName: sheet?.groupName || "Unknown Group",
        day: sheet?.day || null,
        date: sheet?.date || null,
        leaderName: sheet?.leaderName || "Unknown Leader",
      };
    });
  }, [members, sheetsById]);

  const filteredMembers = enrichedMembers.filter((member) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      member.fullName?.toLowerCase().includes(term) ||
      member.phone?.toLowerCase().includes(term) ||
      member.address?.toLowerCase().includes(term);

    const matchesDay = dayFilter === "all" || member.day === dayFilter;

    const matchesMonth =
      monthFilter === "all" ||
      (member.date &&
        MONTHS[new Date(member.date).getMonth()] === monthFilter);

    const matchesLeader =
      leaderFilter === "all" || member.leaderName === leaderFilter;

    return matchesSearch && matchesDay && matchesMonth && matchesLeader;
  });

  const loading = loadingMembers || loadingSheets;

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          All Members
        </h1>
        <p className="text-slate-500 mt-1">
          Church-wide records, across all leaders — every detail as recorded.
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
            placeholder="Search by name, phone, or address..."
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

      <p className="text-sm text-slate-500 -mt-4">
        {loading ? "Loading…" : `${filteredMembers.length} record${filteredMembers.length === 1 ? "" : "s"}`}
      </p>

      <Card className="border border-slate-200 shadow-none rounded-xl">
        <CardContent className="p-0">

          {loading ? (
            <p className="text-sm text-slate-500 p-6">Loading...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-slate-500 p-6">
              No members match your filters.
            </p>
          ) : (
            <>
              {/* Mobile: stacked cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="p-4 space-y-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {member.fullName || "Unnamed Member"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {member.groupName} · {member.date} ({member.day}) · Recorded by {member.leaderName}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      {member.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} />
                          {member.phone}
                        </span>
                      )}
                      {member.address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="shrink-0" />
                          {member.address}
                        </span>
                      )}
                    </div>

                    {member.prayerRequest && (
                      <div className="flex items-start gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <MessageCircleHeart size={14} className="mt-0.5 shrink-0 text-blue-600" />
                        <span>{member.prayerRequest}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          member.acceptedJesus === "Yes"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.acceptedJesus === "Yes" ? "Accepted Jesus" : "Not Yet"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          member.willCome === "Yes"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.willCome === "Yes" ? "Coming Sunday" : "Not Confirmed"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          member.followUpCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {member.followUpCompleted ? "Follow-up Done" : member.followUpStatus || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-6 py-3 whitespace-nowrap">
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
                      <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-3 py-3 whitespace-nowrap">
                        Sunday Attendance
                      </th>
                      <th className="text-left font-medium text-[11px] uppercase tracking-wide text-slate-400 px-6 py-3 whitespace-nowrap">
                        Follow-up Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="align-top">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {member.fullName || "Unnamed Member"}
                          </p>
                          {member.prayerRequest && (
                            <div className="flex items-start gap-1.5 mt-2 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 max-w-xs">
                              <MessageCircleHeart size={14} className="mt-0.5 shrink-0 text-blue-600" />
                              <span>{member.prayerRequest}</span>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            {member.groupName} · {member.date} ({member.day}) · Recorded by {member.leaderName}
                          </p>
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
                            <span className="flex items-center gap-1.5 text-slate-600">
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
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {member.acceptedJesus === "Yes" ? "Accepted Jesus" : "Not Yet"}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              member.followUpCompleted
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {member.followUpCompleted ? "Follow-up Done" : member.followUpStatus || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </CardContent>
      </Card>

    </div>
  );
}