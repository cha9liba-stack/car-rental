"use client";

import { isConfigured } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Car, Flame } from "lucide-react";
import { useAuth } from "./auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FirebaseGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const publicPaths = ["/login", "/register"];
    if (!loading && !user && isConfigured && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
    if (!loading && user && publicPaths.includes(pathname)) {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--bg-gradient)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-3xl p-12 max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Car size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              نظام إدارة كراء السيارات
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              يرجى تهيئة Firebase
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-start gap-3">
              <Flame size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200 text-right">
                يرجى ضبط متغيرات Firebase في ملف{" "}
                <code className="text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded font-mono">
                  .env.local
                </code>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-gradient)" }}>
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (pathname === "/login" && user) {
    return null;
  }

  return <>{children}</>;
}
