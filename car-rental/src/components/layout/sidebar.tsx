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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./theme-provider";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: Car, label: "Véhicules", href: "/cars" },
  { icon: FileText, label: "Contrats", href: "/contracts" },
  { icon: CreditCard, label: "Paiements", href: "/payments" },
  { icon: BarChart3, label: "Rapports", href: "/reports" },
  { icon: Settings, label: "Paramètres", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 glass-strong rounded-xl"
      >
        <Menu size={20} className="text-gray-700 dark:text-gray-300" />
      </button>

      <motion.aside
        animate={{ width: collapsed ? 80 : 270 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "fixed left-0 top-0 h-full z-40",
          "hidden lg:flex flex-col glass-strong border-r border-white/20 dark:border-white/5"
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
                Gestion Location
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
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
                    {item.label}
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
              {theme === "dark" ? "Mode clair" : "Mode sombre"}
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
