"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = "Aucune donnée",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 text-gray-400 dark:text-gray-500 glass-strong rounded-2xl"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm font-medium">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/30 dark:bg-white/[0.02]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className={cn(
                  "transition-all duration-150",
                  onRowClick && "cursor-pointer hover:bg-white/40 dark:hover:bg-white/5"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-6 py-4 text-sm text-gray-700 dark:text-gray-300", col.className)}
                  >
                    {col.render
                      ? col.render(item)
                      : (item as any)[col.key] ?? "-"}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
