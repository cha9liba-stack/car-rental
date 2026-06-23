"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLang } from "@/components/layout/language-provider";
import { Car, Contract, Maintenance } from "@/lib/types";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Select } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FleetCar extends Car {
  currentContract?: Contract;
  futureMaintenance?: Maintenance;
}

export default function FleetPage() {
  const { t, lang } = useLang();
  const [cars, setCars] = useState<Car[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [carSnap, conSnap, maintSnap] = await Promise.all([
        getDocs(collection(db, "cars")),
        getDocs(collection(db, "contracts")),
        getDocs(collection(db, "maintenance")),
      ]);
      setCars(carSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Car)));
      setContracts(conSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Contract)));
      setMaintenance(maintSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Maintenance)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fleet: FleetCar[] = useMemo(() => {
    const activeContracts = contracts.filter((c) => c.status === "active");
    const now = new Date();
    return cars.map((car) => {
      const currentContract = activeContracts.find((c) => c.carId === car.id);
      const futureMaintenance = maintenance
        .filter((m) => m.carId === car.id && new Date(m.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      return { ...car, currentContract, futureMaintenance };
    });
  }, [cars, contracts, maintenance]);

  const filtered = useMemo(() => {
    let items = fleet;
    if (search) items = items.filter((c) =>
      `${c.brand} ${c.model} ${c.plateNumber}`.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "all") {
      if (statusFilter === "available") items = items.filter((c) => c.status === "available" && !c.currentContract);
      else if (statusFilter === "rented") items = items.filter((c) => c.currentContract);
      else items = items.filter((c) => c.status === statusFilter);
    }
    return items;
  }, [fleet, search, statusFilter]);

  const columns = [
    {
      key: "car",
      header: t("vehicle"),
      render: (c: FleetCar) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{c.brand}</span>
          <span className="text-gray-500 dark:text-gray-400">{c.model}</span>
        </div>
      ),
    },
    {
      key: "plate",
      header: t("plate"),
      render: (c: FleetCar) => <span className="text-gray-600 dark:text-gray-400 text-sm">{c.plateNumber}</span>,
    },
    {
      key: "status",
      header: t("car_status"),
      render: (c: FleetCar) => {
        if (c.currentContract) {
          return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{t("status_rented")}</span>;
        }
        if (c.status === "maintenance") {
          return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">{t("status_maintenance")}</span>;
        }
        if (c.status === "retired") {
          return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t("status_retired")}</span>;
        }
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">{t("status_available")}</span>;
      },
    },
    {
      key: "client",
      header: t("current_client"),
      render: (c: FleetCar) => <span className="text-gray-700 dark:text-gray-300">{c.currentContract?.clientName || t("no_contract")}</span>,
    },
    {
      key: "returnDate",
      header: t("return_date"),
      render: (c: FleetCar) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {c.currentContract?.endDate ? new Date(c.currentContract.endDate).toLocaleDateString(lang === "ar" ? "ar-TN" : "fr-FR") : "-"}
        </span>
      ),
    },
    {
      key: "days",
      header: t("days_remaining"),
      render: (c: FleetCar) => {
        if (!c.currentContract) return <span className="text-gray-400">-</span>;
        const daysLeft = Math.ceil((new Date(c.currentContract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const color = daysLeft <= 0 ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
          daysLeft <= 2 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
          "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400";
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{daysLeft <= 0 ? "!" : `${daysLeft} ${t("days")}`}</span>;
      },
    },
    {
      key: "maintenance",
      header: t("next_maintenance_due"),
      render: (c: FleetCar) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {c.futureMaintenance?.date ? new Date(c.futureMaintenance.date).toLocaleDateString(lang === "ar" ? "ar-TN" : "fr-FR") : "-"}
        </span>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("fleet_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("fleet_desc")}</p>
        </div>
      </div>

      <Card hover={false} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_car")}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <Select
            options={[
              { value: "all", label: t("all") },
              { value: "available", label: t("status_available") },
              { value: "rented", label: t("status_rented") },
              { value: "maintenance", label: t("status_maintenance") },
              { value: "retired", label: t("status_retired") },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 rounded-2xl shimmer" />)}
        </div>
      ) : (
        <Table columns={columns} data={filtered} emptyMessage={t("no_cars")} />
      )}
    </motion.div>
  );
}
