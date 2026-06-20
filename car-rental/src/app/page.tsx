"use client";

import { useEffect, useState } from "react";
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
  ArrowDownRight,
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
  const [loading, setLoading] = useState(true);

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
        snapshot.forEach((doc) => {
          total++;
          const status = doc.data().status;
          if (status === "available") available++;
          if (status === "maintenance") maintenance++;
        });
        setStats((s) => ({
          ...s,
          totalCars: total,
          availableCars: available,
          carsInMaintenance: maintenance,
        }));
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
    });

    return () => {
      unsubscribers.forEach((u) => u());
      unsubContracts();
    };
  }, []);

  const contractColumns = [
    {
      key: "clientName",
      header: "Client",
    },
    {
      key: "carName",
      header: "Véhicule",
    },
    {
      key: "totalAmount",
      header: "Montant",
      render: (c: Contract) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(c.totalAmount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (c: Contract) => <Badge status={c.status} />,
    },
    {
      key: "createdAt",
      header: "Date",
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
            Tableau de bord
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Aperçu de l&apos;activité de l&apos;agence
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CalendarDays size={14} />
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Contrats actifs"
          value={String(stats.activeContracts)}
          icon={<FileText size={20} />}
          color="blue"
          trend={stats.activeContracts > 0 ? { value: "actifs", positive: true } : undefined}
        />
        <StatCard
          title="Véhicules disponibles"
          value={`${stats.availableCars}/${stats.totalCars}`}
          icon={<Car size={20} />}
          color="green"
          subtitle={`${stats.carsInMaintenance} en maintenance`}
        />
        <StatCard
          title="Revenus du mois"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<DollarSign size={20} />}
          color="amber"
          trend={stats.monthlyRevenue > 0 ? { value: "ce mois", positive: true } : undefined}
        />
        <StatCard
          title="Total clients"
          value={String(stats.clientsCount)}
          icon={<Users size={20} />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Derniers contrats</CardTitle>
              <Link
                href="/contracts"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                Voir tout
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
                emptyMessage="Aucun contrat pour le moment"
              />
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <Link
                href="/clients"
                className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
              >
                <Users size={18} />
                <span className="text-sm font-medium">Gérer les clients</span>
              </Link>
              <Link
                href="/cars"
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
              >
                <Car size={18} />
                <span className="text-sm font-medium">Gérer les véhicules</span>
              </Link>
              <Link
                href="/contracts"
                className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
              >
                <FileText size={18} />
                <span className="text-sm font-medium">Nouveau contrat</span>
              </Link>
              <Link
                href="/payments"
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
              >
                <DollarSign size={18} />
                <span className="text-sm font-medium">Enregistrer un paiement</span>
              </Link>
            </div>
          </Card>

          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Alertes</CardTitle>
            </CardHeader>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              <AlertCircle size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              Aucune alerte pour le moment
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
