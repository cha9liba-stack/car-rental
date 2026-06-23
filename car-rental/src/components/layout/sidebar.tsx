"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  Moon,
  Sun,
  Wrench,
  History,
  Receipt,
  LayoutGrid,
  Star,
  LogOut,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth-context";
import { useLang } from "./language-provider";

type MenuItem = { icon: any; labelKey: string; href: string };

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const { lang, setLang, t } = useLang();

  const flexDir = lang === "fr" ? "flex-row-reverse" : "";

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, labelKey: "dashboard", href: "/" },
    { icon: Users, labelKey: "clients", href: "/clients" },
    { icon: Car, labelKey: "cars", href: "/cars" },
    { icon: FileText, labelKey: "contracts", href: "/contracts" },
    { icon: CreditCard, labelKey: "payments", href: "/payments" },
    { icon: Wrench, labelKey: "maintenance", href: "/maintenance" },
    { icon: History, labelKey: "activity_log", href: "/activity-log" },
    { icon: Receipt, labelKey: "expenses", href: "/expenses" },
    { icon: LayoutGrid, labelKey: "fleet", href: "/fleet" },
    { icon: Star, labelKey: "loyalty", href: "/loyalty" },
    { icon: BarChart3, labelKey: "reports", href: "/reports" },
    { icon: Settings, labelKey: "settings", href: "/settings" },
  ];

  if (pathname === "/login") return null;

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 glass-strong rounded-xl"
      >
        <Menu size={20} className="text-gray-700 dark:text-gray-300" />
      </button>

      <motion.aside
        animate={{ width: collapsed ? 80 : 270 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "fixed top-0 h-full z-40",
          lang === "ar" ? "right-0 border-l" : "left-0 border-r",
          "hidden lg:flex flex-col glass-strong border-white/20 dark:border-white/5"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1 }}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-base whitespace-nowrap">
                AutoRent
              </span>
              <span className="block text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase">
                {t('appSubtitle')}
              </span>
            </div>
          </motion.div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft size={18} />
            </motion.div>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item, i) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    flexDir,
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 font-medium shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5"
                  )}
                >
                  <Icon size={20} className="shrink-0" />
                  <motion.span
                    animate={{
                      opacity: collapsed ? 0 : 1,
                      width: collapsed ? 0 : "auto",
                    }}
                    className="whitespace-nowrap overflow-hidden text-sm"
                  >
                    {t(item.labelKey)}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            onClick={toggle}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-sm",
              flexDir,
              "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5"
            )}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <motion.span
              animate={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : "auto",
              }}
              className="whitespace-nowrap overflow-hidden"
            >
              {t(theme === "dark" ? "light_mode" : "dark_mode")}
            </motion.span>
          </button>
          <button
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-sm",
              flexDir,
              "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5"
            )}
          >
            <Globe size={18} />
            <motion.span
              animate={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : "auto",
              }}
              className="whitespace-nowrap overflow-hidden"
            >
              {lang === "ar" ? t("french") : t("arabic")}
            </motion.span>
          </button>
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-sm",
              flexDir,
              "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-white/5"
            )}
          >
            <LogOut size={18} />
            <motion.span
              animate={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : "auto",
              }}
              className="whitespace-nowrap overflow-hidden"
            >
              {t('logout')}
            </motion.span>
          </button>
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1 }}
            className="text-[10px] text-gray-400 dark:text-gray-600 text-center py-1 font-mono"
          >
            v2.0.0
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}
