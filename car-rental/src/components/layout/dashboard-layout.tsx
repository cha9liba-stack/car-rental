"use client";

import Sidebar from "./sidebar";
import FirebaseGuard from "./firebase-guard";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseGuard>
      <div className="flex min-h-screen" style={{ background: "var(--bg-gradient)" }}>
        <Sidebar />
        <main className="flex-1 lg:ml-[270px] min-h-screen">
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </FirebaseGuard>
  );
}
