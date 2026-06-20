"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  className?: string;
  hover?: boolean;
  children?: ReactNode;
  glow?: boolean;
}

export function Card({ className, hover = true, children, glow }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, scale: 1.003 } : undefined}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "glass-strong rounded-2xl p-6 transition-all duration-300",
        hover && "hover:shadow-[0_12px_40px_rgba(99,102,241,0.08)]",
        glow && "shadow-[0_0_30px_rgba(99,102,241,0.06)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)}>
      {children}
    </h3>
  );
}

export function StatCard({
  title,
  value,
  icon,
  color = "blue",
  subtitle,
  trend,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  color?: "blue" | "green" | "amber" | "purple" | "red" | "pink";
  subtitle?: string;
  trend?: { value: string; positive: boolean };
}) {
  const colors: Record<string, string> = {
    blue: "from-indigo-500 to-blue-600 shadow-indigo-500/25",
    green: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/25",
    purple: "from-purple-500 to-violet-600 shadow-purple-500/25",
    red: "from-red-500 to-rose-600 shadow-red-500/25",
    pink: "from-pink-500 to-rose-600 shadow-pink-500/25",
  };

  const bgColors: Record<string, string> = {
    blue: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
    green: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    pink: "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-strong rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(99,102,241,0.08)]"
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl", bgColors[color])}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-lg",
            trend.positive
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          )}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
        {subtitle && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="shimmer w-full h-1 rounded-full" />
            <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
