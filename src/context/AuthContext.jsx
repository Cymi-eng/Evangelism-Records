import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "@/config/firebase";

const AuthContext = createContext();

async function fetchRole(uid) {
  // 1. Check the admin collection first
  const adminRef = doc(db, "admin", uid);
  const adminSnap = await getDoc(adminRef);

  if (adminSnap.exists()) {
    return "admin";
  }

  // 2. Fall back to the users collection (leaders, etc.)
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data().role ?? null;
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Manually re-checks Firestore for the current user's role. Call this
  // right after writing a new user document (e.g. after registration) so
  // the app doesn't have to wait for another auth state change — which
  // may never come, since the user is already signed in.
  const refreshRole = useCallback(async () => {
    if (!auth.currentUser) {
      setRole(null);
      return null;
    }

    try {
      const nextRole = await fetchRole(auth.currentUser.uid);
      setRole(nextRole);
      return nextRole;
    } catch (error) {
      console.error("Error refreshing user role:", error);
      setRole(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const nextRole = await fetchRole(currentUser.uid);
        setRole(nextRole);
      } catch (error) {
        console.error("Error loading user role:", error);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        logout,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}