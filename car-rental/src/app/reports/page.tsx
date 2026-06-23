"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  Download,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import Button from "@/components/ui/button";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Contract, Payment, Car as CarType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useLang } from "@/components/layout/language-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ReportsPage() {
  const { t, lang } = useLang();
  const [period, setPeriod] = useState("month");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, "contracts"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc"))),
      getDocs(collection(db, "cars")),
    ]).then(([cSnap, pSnap, carSnap]) => {
      setContracts(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Contract)));
      setPayments(pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)));
      setCars(carSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CarType)));
      setLoading(false);
    });
  }, []);

  const filteredContracts = contracts.filter((c) => {
    const year = new Date(c.createdAt).getFullYear().toString();
    return year === yearFilter;
  });

  const totalRevenue = filteredContracts
    .filter((c) => c.status === "completed" || c.status === "active")
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const activeContracts = filteredContracts.filter((c) => c.status === "active").length;
  const availableCars = cars.filter((c) => c.status === "available").length;
  const totalPayments = payments
    .filter((p) => new Date(p.paymentDate).getFullYear().toString() === yearFilter)
    .reduce((sum, p) => sum + p.amount, 0);

  const revenueByMonth = filteredContracts.reduce((acc: any, c) => {
    const month = new Date(c.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "ar-SA", { month: "short" });
    acc[month] = (acc[month] || 0) + c.totalAmount;
    return acc;
  }, {});

  const revKey = lang === "fr" ? "Revenus" : "الإيرادات";
  const chartData = Object.entries(revenueByMonth).map(([name, value]) => ({
    name,
    [revKey]: value,
  }));

  const paymentsByMonth = payments
    .filter((p) => new Date(p.paymentDate).getFullYear().toString() === yearFilter)
    .reduce((acc: any, p) => {
      const month = new Date(p.paymentDate).toLocaleString(lang === "fr" ? "fr-FR" : "ar-SA", { month: "short" });
      acc[month] = (acc[month] || 0) + p.amount;
      return acc;
    }, {});

  const payKey = lang === "fr" ? "Paiements" : "المدفوعات";
  const paymentChartData = Object.entries(paymentsByMonth).map(([name, value]) => ({
    name,
    [payKey]: value,
  }));

  const carStatusData = [
    { name: t("available"), value: cars.filter((c) => c.status === "available").length },
    { name: t("rented"), value: cars.filter((c) => c.status === "rented").length },
    { name: t("maintenance_s"), value: cars.filter((c) => c.status === "maintenance").length },
    { name: t("retired"), value: cars.filter((c) => c.status === "retired").length },
  ].filter((d) => d.value > 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const TooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-xl px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("reports_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("reports_desc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={years.map((y) => ({ value: y, label: y }))}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          />
          <Button variant="outline" onClick={() => {
            const csv = [
              [t("month"), t("revenue"), t("payments")].join(","),
              ...chartData.map((d, i) => {
                const p = paymentChartData[i];
                return [d.name, d.الإيرادات, p?.المدفوعات || 0].join(",");
              }),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${t("report")}_${yearFilter}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download size={16} />
            {t("export_csv")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title={t("total_revenue")} value={formatCurrency(totalRevenue)} icon={<DollarSign size={20} />} color="green" />
        <StatCard title={t("active_contracts")} value={String(activeContracts)} icon={<TrendingUp size={20} />} color="blue" />
        <StatCard title={t("available_cars")} value={`${availableCars}/${cars.length}`} icon={<Car size={20} />} color="amber" />
        <StatCard title={t("total_payments")} value={formatCurrency(totalPayments)} icon={<BarChart3 size={20} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{t("monthly_revenue_chart")}</CardTitle>
          </CardHeader>
          <div className="h-80">
            {loading ? (
              <div className="h-full rounded-xl shimmer" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip content={<TooltipContent />} />
                  <Bar dataKey={revKey} fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("monthly_payments_chart")}</CardTitle>
          </CardHeader>
          <div className="h-80">
            {loading ? (
              <div className="h-full rounded-xl shimmer" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip content={<TooltipContent />} />
                  <Line type="monotone" dataKey={payKey} stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fleet_status")}</CardTitle>
          </CardHeader>
          <div className="h-80">
            {loading ? (
              <div className="h-full rounded-xl shimmer" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {carStatusData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("top_clients")}</CardTitle>
          </CardHeader>
          <div className="h-80">
            {loading ? (
              <div className="h-full rounded-xl shimmer" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(
                  filteredContracts.reduce((acc: any, c) => {
                    acc[c.clientName] = (acc[c.clientName] || 0) + c.totalAmount;
                    return acc;
                  }, {})
                ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({
                  name: name.length > 10 ? name.slice(0, 10) + "..." : name,
                  [revKey]: value,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip content={<TooltipContent />} />
                  <Bar dataKey={revKey} fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
