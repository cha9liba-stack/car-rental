"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: { email: string; uid: string } | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isDemo: false,
  login: async () => {},
  loginAnonymously: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function getDemoUser(): { email: string; uid: string } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("demo_user");
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  return null;
}

function setDemoUser(u: { email: string; uid: string } | null) {
  if (u) localStorage.setItem("demo_user", JSON.stringify(u));
  else localStorage.removeItem("demo_user");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!auth) {
      const demo = getDemoUser();
      if (demo) { setUser(demo); setIsDemo(true); }
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({ email: firebaseUser.email || "", uid: firebaseUser.uid });
        setIsDemo(false);
      } else {
        const demo = getDemoUser();
        if (demo) { setUser(demo); setIsDemo(true); }
        else setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setUser({ email: cred.user.email || "", uid: cred.user.uid });
        setIsDemo(false);
        setDemoUser(null);
        return;
      } catch {}
    }
    const demo = { email, uid: "demo_" + Date.now() };
    setUser(demo);
    setIsDemo(true);
    setDemoUser(demo);
  };

  const loginAnonymously = async () => {
    if (auth) {
      try {
        const { signInAnonymously } = await import("firebase/auth");
        const cred = await signInAnonymously(auth);
        setUser({ email: cred.user.email || "زائر", uid: cred.user.uid });
        setIsDemo(false);
        setDemoUser(null);
        return;
      } catch {}
    }
    const demo = { email: "زائر", uid: "demo_" + Date.now() };
    setUser(demo);
    setIsDemo(true);
    setDemoUser(demo);
  };

  const logout = async () => {
    if (auth) {
      try { await signOut(auth); } catch {}
    }
    setDemoUser(null);
    setUser(null);
    setIsDemo(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, login, loginAnonymously, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
