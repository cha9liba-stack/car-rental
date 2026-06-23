"use client";

import Sidebar from "./sidebar";
import FirebaseGuard from "./firebase-guard";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import { useLang } from "./language-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { lang } = useLang();
  const isLogin = pathname === "/login";

  return (
    <FirebaseGuard>
      <div className="flex min-h-screen" style={{ background: "var(--bg-gradient)" }}>
        <Sidebar />
        <main className={`flex-1 min-h-screen ${isLogin ? "" : lang === "ar" ? "lg:mr-[270px]" : "lg:ml-[270px]"}`}>
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        <Toaster position="top-left" richColors closeButton />
      </div>
    </FirebaseGuard>
  );
}
