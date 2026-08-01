import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  ClipboardList,
  UserPlus,
  Check,
  Users,
} from "lucide-react";

import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

function todayDate() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function todayDay() {
  return DAYS[new Date().getDay()];
}

const emptyVisitor = {
  fullName: "",
  phone: "",
  address: "",
  prayerRequest: "",
  willCome: "",
  acceptedJesus: "",
};

export default function NewSheet() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Stage: "setup" -> "recording"
  const [stage, setStage] = useState("setup");

  const [leaderName, setLeaderName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [creatingSheet, setCreatingSheet] = useState(false);

  const [sheetId, setSheetId] = useState(null);
  const [visitorCount, setVisitorCount] = useState(0);

  const [visitor, setVisitor] = useState(emptyVisitor);
  const [savingVisitor, setSavingVisitor] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [finishing, setFinishing] = useState(false);

  // Prefill leader name from their user profile, if available
  useEffect(() => {
    const loadLeaderName = async () => {
      if (!user?.uid) return;
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.fullName) setLeaderName(data.fullName);
        }
      } catch (error) {
        console.error("Error loading leader profile:", error);
      }
    };
    loadLeaderName();
  }, [user?.uid]);

  const handleStartRecording = async (e) => {
    e.preventDefault();

    if (!leaderName.trim() || !groupName.trim()) {
      toast.error("Leader name and group name are required.");
      return;
    }

    try {
      setCreatingSheet(true);

      const sheetRef = await addDoc(collection(db, "evangelismSheets"), {
        date: todayDate(),
        day: todayDay(),
        leaderName: leaderName.trim(),
        groupName: groupName.trim(),
        leaderId: user?.uid || null,
        createdAt: serverTimestamp(),
      });

      setSheetId(sheetRef.id);
      setStage("recording");
      toast.success("Evangelism sheet started.");
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to start sheet. Please try again.");
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleVisitorField = (field, value) => {
    setVisitor((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveVisitor = async (e) => {
    e.preventDefault();

    if (!visitor.fullName.trim()) {
      toast.error("Visitor's full name is required.");
      return;
    }
    if (!visitor.willCome) {
      toast.error("Please select if they'll come on Sunday.");
      return;
    }
    if (!visitor.acceptedJesus) {
      toast.error("Please select if they accepted Jesus.");
      return;
    }

    try {
      setSavingVisitor(true);

      await addDoc(collection(db, "members"), {
        sheetId,
        fullName: visitor.fullName.trim(),
        phone: visitor.phone.trim(),
        address: visitor.address.trim(),
        prayerRequest: visitor.prayerRequest.trim(),
        willCome: visitor.willCome,
        acceptedJesus: visitor.acceptedJesus,
        followUpStatus: "Still Following Up",
        followUpCompleted: false,
        discipleship: false,
        leaderId: user?.uid || null,
        createdAt: serverTimestamp(),
      });

      setVisitorCount((prev) => prev + 1);
      setJustSaved(true);
      toast.success("Visitor saved.");
    } catch (error) {
      console.error("Error saving visitor:", error);
      toast.error("Failed to save visitor. Please try again.");
    } finally {
      setSavingVisitor(false);
    }
  };

  const handleAddAnother = () => {
    setVisitor(emptyVisitor);
    setJustSaved(false);
  };

  const handleFinishEvangelism = () => {
    setFinishing(true);
    toast.success(`Evangelism sheet complete — ${visitorCount} visitor${visitorCount === 1 ? "" : "s"} recorded.`);
    navigate("/leader");
  };

  // ---- Stage 1: Sheet setup ----
  if (stage === "setup") {
    return (
      <div className="space-y-6 md:space-y-8 max-w-2xl">

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            New Evangelism Sheet
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Start a new sheet before recording visitors.
          </p>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 md:p-6">

            <form onSubmit={handleStartRecording} className="space-y-5">

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="text"
                    className="mt-2 h-11 bg-slate-50"
                    value={todayDate()}
                    disabled
                  />
                </div>
                <div>
                  <Label>Day</Label>
                  <Input
                    type="text"
                    className="mt-2 h-11 bg-slate-50"
                    value={todayDay()}
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label>Leader Name</Label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  className="mt-2 h-11"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                />
              </div>

              <div>
                <Label>Group Name</Label>
                <Input
                  type="text"
                  placeholder="e.g. Group Alpha"
                  className="mt-2 h-11"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={creatingSheet}
              >
                <ClipboardList size={18} />
                {creatingSheet ? "Starting..." : "Start Recording"}
              </Button>

            </form>

          </CardContent>
        </Card>

      </div>
    );
  }

  // ---- Stage 2: Recording visitors ----
  return (
    <div className="space-y-6 md:space-y-8 max-w-2xl">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 break-words">
            {groupName}
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            {todayDate()} · {todayDay()}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
          <Users size={16} />
          {visitorCount} recorded
        </div>
      </div>

      {justSaved ? (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6 md:p-8 text-center space-y-6">

            <div className="flex flex-col items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-full">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-medium text-slate-800">
                Visitor saved successfully.
              </p>
              <p className="text-sm text-slate-500">
                What would you like to do next?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddAnother}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Add Another Visitor
              </Button>
              <Button
                onClick={handleFinishEvangelism}
                variant="outline"
                className="flex-1 h-11 flex items-center justify-center gap-2"
                disabled={finishing}
              >
                Finish Evangelism
              </Button>
            </div>

          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 md:p-6">

            <form onSubmit={handleSaveVisitor} className="space-y-5">

              <div>
                <Label>Full Name</Label>
                <Input
                  type="text"
                  placeholder="Enter visitor's full name"
                  className="mt-2 h-11"
                  value={visitor.fullName}
                  onChange={(e) => handleVisitorField("fullName", e.target.value)}
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  className="mt-2 h-11"
                  value={visitor.phone}
                  onChange={(e) => handleVisitorField("phone", e.target.value)}
                />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  type="text"
                  placeholder="Enter address"
                  className="mt-2 h-11"
                  value={visitor.address}
                  onChange={(e) => handleVisitorField("address", e.target.value)}
                />
              </div>

              <div>
                <Label>Prayer Request</Label>
                <textarea
                  placeholder="What would they like prayer for?"
                  className="mt-2 min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={visitor.prayerRequest}
                  onChange={(e) => handleVisitorField("prayerRequest", e.target.value)}
                />
              </div>

              <div>
                <Label>Will Come on Sunday?</Label>
                <div className="flex gap-3 mt-2">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleVisitorField("willCome", option)}
                      className={`flex-1 h-11 rounded-lg text-sm font-medium border transition-colors ${
                        visitor.willCome === option
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Accepted Jesus?</Label>
                <div className="flex gap-3 mt-2">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleVisitorField("acceptedJesus", option)}
                      className={`flex-1 h-11 rounded-lg text-sm font-medium border transition-colors ${
                        visitor.acceptedJesus === option
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={savingVisitor}
              >
                <UserPlus size={18} />
                {savingVisitor ? "Saving..." : "Save Visitor"}
              </Button>

            </form>

          </CardContent>
        </Card>
      )}

    </div>
  );
}