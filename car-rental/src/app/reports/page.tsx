"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  Calendar,
  Download,
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
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
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

  const totalRevenue = contracts
    .filter((c) => c.status === "completed" || c.status === "active")
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const activeContracts = contracts.filter((c) => c.status === "active").length;
  const availableCars = cars.filter((c) => c.status === "available").length;
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  const revenueByMonth = contracts.reduce((acc: any, c) => {
    const month = new Date(c.createdAt).toLocaleString("fr-FR", { month: "short", year: "2-digit" });
    acc[month] = (acc[month] || 0) + c.totalAmount;
    return acc;
  }, {});

  const chartData = Object.entries(revenueByMonth).map(([name, value]) => ({
    name,
    revenu: value,
  }));

  const carStatusData = [
    { name: "Disponible", value: cars.filter((c) => c.status === "available").length },
    { name: "Louée", value: cars.filter((c) => c.status === "rented").length },
    { name: "Maintenance", value: cars.filter((c) => c.status === "maintenance").length },
    { name: "Retirée", value: cars.filter((c) => c.status === "retired").length },
  ].filter((d) => d.value > 0);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Statistiques et analyses</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: "week", label: "Hebdomadaire" },
              { value: "month", label: "Mensuel" },
              { value: "year", label: "Annuel" },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <Button variant="outline">
            <Download size={16} />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Revenus totaux" value={formatCurrency(totalRevenue)} icon={<DollarSign size={20} />} color="green" />
        <StatCard title="Contrats actifs" value={String(activeContracts)} icon={<TrendingUp size={20} />} color="blue" />
        <StatCard title="Véhicules disponibles" value={`${availableCars}/${cars.length}`} icon={<Car size={20} />} color="amber" />
        <StatCard title="Total paiements" value={formatCurrency(totalPayments)} icon={<BarChart3 size={20} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Revenus mensuels</CardTitle>
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
                  <Bar dataKey="revenu" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>État de la flotte</CardTitle>
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
      </div>
    </motion.div>
  );
}
