import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getLang(): string {
  if (typeof window === "undefined") return "ar";
  return localStorage.getItem("lang") || "ar";
}

export function formatCurrency(amount: number): string {
  const lang = getLang();
  const fmt = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
  return lang === "fr" ? `${fmt} DT` : `${fmt} د.ت`;
}

export function formatDate(date: string): string {
  const locale = getLang() === "fr" ? "fr-FR" : "ar-TN";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: string): string {
  const locale = getLang() === "fr" ? "fr-FR" : "ar-TN";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateInput(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    rented: "bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    maintenance: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    retired: "bg-gray-100/80 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
    active: "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    completed: "bg-gray-100/80 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
    cancelled: "bg-red-100/80 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    paid: "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    pending: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    overdue: "bg-red-100/80 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  };
  return colors[status] || "bg-gray-100/80 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700";
}

export function getStatusLabel(status: string): string {
  const lang = getLang();
  if (lang === "fr") {
    const labels: Record<string, string> = {
      available: "Disponible",
      rented: "Louée",
      maintenance: "Maintenance",
      retired: "Retirée",
      active: "Actif",
      completed: "Terminé",
      cancelled: "Annulé",
      paid: "Payé",
      pending: "En attente",
      overdue: "En retard",
    };
    return labels[status] || status;
  }
  const labels: Record<string, string> = {
    available: "متاحة",
    rented: "مؤجرة",
    maintenance: "صيانة",
    retired: "متقاعدة",
    active: "نشط",
    completed: "منتهي",
    cancelled: "ملغي",
    paid: "مدفوع",
    pending: "قيد الانتظار",
    overdue: "متأخر",
  };
  return labels[status] || status;
}
