import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { CheckCircle2, Phone, MapPin, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";

import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_STATUS = "Still Following Up";

const STATUS_OPTIONS = [
  "Still Following Up",
  "Called",
  "Visited",
  "Came to Church",
  "Not Reachable",
  "Attended Church",
  "Transferred to Discipleship",
];

const STATUS_COLORS = {
  "Still Following Up": "bg-slate-100 text-slate-600",
  "Called": "bg-blue-100 text-blue-700",
  "Visited": "bg-purple-100 text-purple-700",
  "Came to Church": "bg-emerald-100 text-emerald-700",
  "Not Reachable": "bg-red-100 text-red-700",
  "Attended Church": "bg-emerald-100 text-emerald-700",
  "Transferred to Discipleship": "bg-amber-100 text-amber-700",
};

// A visitor's status counts as "updated" once the leader has moved it
// off the default value. Until then, the follow-up can't be marked complete.
const isStatusUpdated = (visitor) =>
  Boolean(visitor.followUpStatus) && visitor.followUpStatus !== DEFAULT_STATUS;

export default function FollowUps() {
  const { user } = useAuth();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const visitorsRef = collection(db, "visitors");
    const followUpQuery = query(
      visitorsRef,
      where("leaderId", "==", user.uid),
      where("followUpCompleted", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      followUpQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setVisitors(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading follow-ups:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleStatusChange = async (visitorId, newStatus) => {
    const updates = { followUpStatus: newStatus };

    // Special workflow: transferring to discipleship marks the
    // discipleship flag so Admin dashboards can track it separately
    if (newStatus === "Transferred to Discipleship") {
      updates.discipleship = true;
    }

    // Snapshot the previous state so we can roll back on failure
    const previous = visitors;

    // Optimistic update: reflect the change instantly, don't wait on Firestore
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitorId ? { ...v, ...updates } : v))
    );
    setUpdatingId(visitorId);

    try {
      await updateDoc(doc(db, "visitors", visitorId), updates);
      toast.success(`Status updated to "${newStatus}".`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.");
      setVisitors(previous); // roll back
    } finally {
      setUpdatingId(null);
    }
  };

  const markFollowUpComplete = async (visitorId) => {
    const previous = visitors;

    // Optimistic update: remove it from the list immediately since it
    // no longer matches the followUpCompleted === false query
    setVisitors((prev) => prev.filter((v) => v.id !== visitorId));
    setUpdatingId(visitorId);

    try {
      await updateDoc(doc(db, "visitors", visitorId), {
        followUpCompleted: true,
      });
      toast.success("Follow-up marked complete.");
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast.error("Failed to update. Please try again.");
      setVisitors(previous); // roll back
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Follow Ups
        </h1>
        <p className="text-slate-500 mt-1">
          Visitors who still need a follow-up.
        </p>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : visitors.length === 0 ? (
            <p className="text-sm text-slate-500">
              No pending follow-ups. You're all caught up.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {visitors.map((visitor) => (
                <div key={visitor.id} className="py-5 space-y-3">

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
                      {visitor.prayerRequest && (
                        <p className="text-sm text-slate-400 mt-1 italic max-w-md">
                          "{visitor.prayerRequest}"
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                        STATUS_COLORS[visitor.followUpStatus] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {visitor.followUpStatus || DEFAULT_STATUS}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">

                    <div className="relative">
                      <select
                        value={visitor.followUpStatus || DEFAULT_STATUS}
                        onChange={(e) =>
                          handleStatusChange(visitor.id, e.target.value)
                        }
                        disabled={updatingId === visitor.id}
                        className="appearance-none h-9 pl-3 pr-8 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>

                    <button
                      onClick={() => markFollowUpComplete(visitor.id)}
                      disabled={
                        updatingId === visitor.id || !isStatusUpdated(visitor)
                      }
                      title={
                        !isStatusUpdated(visitor)
                          ? "Update the follow-up status before marking complete"
                          : undefined
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-50"
                    >
                      <CheckCircle2 size={16} />
                      {updatingId === visitor.id
                        ? "Updating..."
                        : "Follow-up Complete"}
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