"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/layout/language-provider";
import { motion } from "framer-motion";
import {
  Car,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  DollarSign,
  CalendarDays,
  ArrowUpRight,
  Shield,
  Wrench,
} from "lucide-react";
import { Card, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Car as CarType, Contract, Client } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import Link from "next/link";

interface Alert {
  type: "insurance" | "inspection" | "overdue";
  message: string;
  carName: string;
  carId: string;
  date: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalCars: 0,
    availableCars: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    carsInMaintenance: 0,
    clientsCount: 0,
  });
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();

  useEffect(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const unsubscribers = [
      onSnapshot(collection(db, "contracts"), (snapshot) => {
        let active = 0;
        let monthlyRev = 0;
        let totalRev = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          totalRev += data.totalAmount || 0;
          if (data.status === "active") active++;
          if (data.createdAt >= startOfMonth.toISOString()) {
            monthlyRev += data.totalAmount || 0;
          }
        });
        setStats((s) => ({
          ...s,
          activeContracts: active,
          monthlyRevenue: monthlyRev,
          totalRevenue: totalRev,
        }));
      }),
      onSnapshot(collection(db, "cars"), (snapshot) => {
        let total = 0;
        let available = 0;
        let maintenance = 0;
        const now = new Date();
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const newAlerts: Alert[] = [];

        snapshot.forEach((doc) => {
          total++;
          const data = doc.data();
          const status = data.status;
          if (status === "available") available++;
          if (status === "maintenance") maintenance++;

          const carName = `${data.brand || ""} ${data.model || ""} (${data.plateNumber || ""})`;

          if (data.insuranceExpiryDate) {
            const expiry = new Date(data.insuranceExpiryDate);
            if (expiry <= thirtyDays && expiry >= now) {
              newAlerts.push({
                type: "insurance",
                message: t("insurance_expiring"),
                carName,
                carId: doc.id,
                date: data.insuranceExpiryDate,
              });
            }
            if (expiry < now) {
              newAlerts.push({
                type: "insurance",
                message: t("insurance_expired"),
                carName,
                carId: doc.id,
                date: data.insuranceExpiryDate,
              });
            }
          }

          if (data.technicalInspectionDate) {
            const inspection = new Date(data.technicalInspectionDate);
            if (inspection <= thirtyDays && inspection >= now) {
              newAlerts.push({
                type: "inspection",
                message: t("inspection_expiring"),
                carName,
                carId: doc.id,
                date: data.technicalInspectionDate,
              });
            }
            if (inspection < now) {
              newAlerts.push({
                type: "inspection",
                message: t("inspection_expired"),
                carName,
                carId: doc.id,
                date: data.technicalInspectionDate,
              });
            }
          }
        });
        setStats((s) => ({
          ...s,
          totalCars: total,
          availableCars: available,
          carsInMaintenance: maintenance,
        }));
        setAlerts((prev) => {
          const nonOverdue = prev.filter((a) => a.type === "overdue");
          return [...nonOverdue, ...newAlerts];
        });
      }),
      onSnapshot(collection(db, "clients"), (snapshot) => {
        setStats((s) => ({ ...s, clientsCount: snapshot.size }));
      }),
    ];

    const q = query(
      collection(db, "contracts"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubContracts = onSnapshot(q, (snapshot) => {
      const contracts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Contract)
      );
      setRecentContracts(contracts);
      setLoading(false);

      const overdueAlerts: Alert[] = [];
      const now = new Date();
      contracts.forEach((c) => {
        if (c.status === "active" && new Date(c.endDate) < now) {
          overdueAlerts.push({
            type: "overdue",
            message: t("contract_overdue"),
            carName: c.carName || "",
            carId: c.carId || "",
            date: c.endDate,
          });
        }
      });
      setAlerts((prev) => {
        const nonOverdue = prev.filter((a) => a.type !== "overdue");
        return [...nonOverdue, ...overdueAlerts];
      });
    });

    return () => {
      unsubscribers.forEach((u) => u());
      unsubContracts();
    };
  }, []);

  const contractColumns = [
    {
      key: "clientName",
      header: t("client"),
    },
    {
      key: "carName",
      header: t("vehicle"),
    },
    {
      key: "totalAmount",
      header: t("amount"),
      render: (c: Contract) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(c.totalAmount)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (c: Contract) => <Badge status={c.status} />,
    },
    {
      key: "createdAt",
      header: t("date"),
      render: (c: Contract) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDateShort(c.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("dashboard_title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("dashboard_desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CalendarDays size={14} />
          {new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "ar-SA", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title={t("active_contracts")}
          value={String(stats.activeContracts)}
          icon={<FileText size={20} />}
          color="blue"
          trend={stats.activeContracts > 0 ? { value: t("active"), positive: true } : undefined}
        />
        <StatCard
          title={t("available_cars")}
          value={`${stats.availableCars}/${stats.totalCars}`}
          icon={<Car size={20} />}
          color="green"
          subtitle={`${stats.carsInMaintenance} ${t("in_maintenance")}`}
        />
        <StatCard
          title={t("monthly_revenue")}
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<DollarSign size={20} />}
          color="amber"
          trend={stats.monthlyRevenue > 0 ? { value: t("this_month"), positive: true } : undefined}
        />
        <StatCard
          title={t("total_clients")}
          value={String(stats.clientsCount)}
          icon={<Users size={20} />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("recent_contracts")}</CardTitle>
              <Link
                href="/contracts"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                {t("view_all")}
                <ArrowUpRight size={14} />
              </Link>
            </CardHeader>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl shimmer"
                  />
                ))}
              </div>
            ) : (
              <Table
                columns={contractColumns}
                data={recentContracts}
                emptyMessage={t("no_contracts")}
              />
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("quick_actions")}</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <Link
                href="/clients"
                className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
              >
                <Users size={18} />
                <span className="text-sm font-medium">{t("manage_clients")}</span>
              </Link>
              <Link
                href="/cars"
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
              >
                <Car size={18} />
                <span className="text-sm font-medium">{t("manage_cars")}</span>
              </Link>
              <Link
                href="/contracts"
                className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
              >
                <FileText size={18} />
                <span className="text-sm font-medium">{t("new_contract")}</span>
              </Link>
              <Link
                href="/payments"
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
              >
                <DollarSign size={18} />
                <span className="text-sm font-medium">{t("add_payment")}</span>
              </Link>
              <Link
                href="/maintenance"
                className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
              >
                <Wrench size={18} />
                <span className="text-sm font-medium">{t("maintenance")}</span>
              </Link>
            </div>
          </Card>

          <Card className="mt-5">
            <CardHeader>
              <CardTitle>{t("alerts")}</CardTitle>
              {alerts.length > 0 && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                  {alerts.length}
                </span>
              )}
            </CardHeader>
            {alerts.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                <AlertCircle size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                {t("no_alerts")}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {alerts.map((alert, i) => (
                  <Link
                    key={i}
                    href={`/cars/${alert.carId}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all group"
                  >
                    <div className={`p-1.5 rounded-lg ${
                      alert.type === "insurance"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                        : alert.type === "inspection"
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500"
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                    }`}>
                      {alert.type === "overdue" ? <AlertCircle size={14} /> : <Shield size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{alert.carName}</p>
                      <p className="text-xs text-gray-400">{formatDateShort(alert.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
