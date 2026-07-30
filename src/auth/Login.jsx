import { useState } from "react";
import { Eye, EyeOff, Church } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/config/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await login(email, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        toast.error("User record not found.");
        return;
      }

      const userData = userDoc.data();

      toast.success(`Welcome ${userData.fullName}!`);

      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/leader");
      }
    } catch (error) {
      console.error(error);
      toast.error("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border-2 border-red-900">
        <CardContent className="p-8">

          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-4 rounded-full mb-4">
              <Church className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-blue-800">
              City Mega Church
            </h1>
            <p className="text-red-900 mt-2 ">
              Evangelism Records
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                className="mt-2 h-11 border-2 border-red-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative mt-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 pr-10 border-2 border-red-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-blue-900">
            © {new Date().getFullYear()} City Mega Church
          </div>

        </CardContent>
      </Card>
    </div>
  );
}