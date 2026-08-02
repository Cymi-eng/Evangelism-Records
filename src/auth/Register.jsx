import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Church, Eye, EyeOff } from "lucide-react";

import { auth, db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * DESIGN NOTES
 * ------------
 * Matches Login.jsx: centered white card, blue circular church mark,
 * "City Mega Church" wordmark, blue primary button. Same visual language,
 * just a second form.
 *
 * WHY THIS FIXES THE "NO ROLE" PROBLEM
 * -------------------------------------
 * Previously, a user could exist in Firebase Authentication without a
 * matching `users/{uid}` Firestore document (or with a missing/misspelled
 * `role` field), which is exactly what produced "No role is assigned to
 * this account." This form creates both in a single flow — the Auth
 * account AND its Firestore profile with a valid `role` — so that state
 * becomes impossible for anyone who signs up through here.
 *
 * SECURITY NOTE — READ BEFORE SHIPPING
 * -------------------------------------
 * Letting anyone self-select "Admin" at signup is fine for development,
 * but is a real privilege-escalation hole in production — anyone could
 * register themselves as an admin. Before you launch, either:
 *   (a) remove the role selector and hardcode role: "leader" here, with
 *       admins promoted manually/by an existing admin, or
 *   (b) gate the "Admin" option behind an invite code / existing-admin
 *       approval step.
 * Firestore security rules should also restrict who can write a `role`
 * field of "admin" to a user document, independent of this form.
 */

export default function Register() {
  const navigate = useNavigate();
  const { refreshRole } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("leader");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create the Firebase Auth account
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = credential.user;

      // 2. Set the display name on the Auth profile itself (optional but nice)
      await updateProfile(user, { displayName: fullName.trim() });

      // 3. Create the matching Firestore user document — this is the step
      //    that was previously missing/inconsistent and caused the
      //    "No role assigned" screen.
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        createdAt: serverTimestamp(),
      });

      // Force AuthContext to re-check Firestore now that the document
      // actually exists — without this, AppRoutes may still be holding
      // the role it read moments earlier (before this write completed),
      // which is what caused the "No role assigned" screen.
      await refreshRole();

      toast.success("Account created.");
      navigate("/"); // AppRoutes will redirect based on the new role
    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-slate-200 rounded-2xl p-8">

        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full mb-4">
            <Church className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-600">
            City Mega Church
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <Label>Full Name</Label>
            <Input
              type="text"
              placeholder="Enter your full name"
              className="mt-2 h-11"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="Enter your email"
              className="mt-2 h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="h-11 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              className="mt-2 h-11"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <Label>Role</Label>
            <div className="flex gap-3 mt-2">
              {["leader", "admin"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`flex-1 h-11 rounded-lg text-sm font-medium border capitalize transition-colors ${
                    role === option
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Remove this selector before going live — see the note at the
              top of Register.jsx.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </Button>

        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 font-medium hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
}