import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/layout/auth-context";
import { LanguageProvider } from "@/components/layout/language-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام إدارة كراء السيارات",
  description: "نظام احترافي لإدارة وكالة كراء السيارات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="ar"
        dir="rtl"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
      <body className="min-h-full">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DashboardLayout>{children}</DashboardLayout>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
