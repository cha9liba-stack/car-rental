"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLang } from "@/components/layout/language-provider";
import { ClientPoints } from "@/lib/types";
import { getLevelColor, getLevelLabel, getNextLevel } from "@/services/loyaltyService";
import { motion } from "framer-motion";
import { Card, StatCard } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Users, Star, Repeat, DollarSign } from "lucide-react";

export default function LoyaltyPage() {
  const { t, lang } = useLang();
  const [clients, setClients] = useState<ClientPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clientPoints"), orderBy("points", "desc"));
      const snap = await getDocs(q);
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientPoints)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const s = search.toLowerCase();
    return clients.filter((c) => c.clientName.toLowerCase().includes(s) || c.cin.includes(s) || c.phone.includes(s));
  }, [clients, search]);

  const totalPoints = useMemo(() => clients.reduce((sum, c) => sum + c.points, 0), [clients]);

  const columns = [
    {
      key: "rank",
      header: "#",
      render: (c: ClientPoints) => <span className="text-gray-400 text-sm font-medium">{filtered.indexOf(c) + 1}</span>,
    },
    {
      key: "clientName",
      header: t("client"),
      render: (c: ClientPoints) => <span className="font-medium text-gray-900 dark:text-white">{c.clientName}</span>,
    },
    {
      key: "cin",
      header: t("cin"),
      render: (c: ClientPoints) => <span className="text-gray-600 dark:text-gray-400 text-sm">{c.cin}</span>,
    },
    {
      key: "phone",
      header: t("phone"),
      render: (c: ClientPoints) => <span className="text-gray-600 dark:text-gray-400 text-sm">{c.phone}</span>,
    },
    {
      key: "level",
      header: t("level"),
      render: (c: ClientPoints) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getLevelColor(c.level)}`}>
          {getLevelLabel(c.level, lang)}
        </span>
      ),
    },
    {
      key: "points",
      header: t("points"),
      render: (c: ClientPoints) => <span className="font-semibold text-gray-900 dark:text-white">{c.points.toLocaleString()}</span>,
    },
    {
      key: "totalRents",
      header: t("total_rents"),
      render: (c: ClientPoints) => <span className="text-gray-700 dark:text-gray-300">{c.totalRents}</span>,
    },
    {
      key: "totalSpent",
      header: t("total_spent"),
      render: (c: ClientPoints) => <span className="text-gray-700 dark:text-gray-300">{c.totalSpent.toLocaleString()} {t("currency_symbol")}</span>,
    },
    {
      key: "nextLevel",
      header: t("next_level"),
      render: (c: ClientPoints) => {
        const next = getNextLevel(c.points);
        return next ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">{next.pointsNeeded.toLocaleString()} {t("points_to_next_level")} ({next.level})</span>
        ) : (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Max</span>
        );
      },
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("loyalty_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t("loyalty_desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t("clients")}
          value={String(clients.length)}
          icon={<Users size={20} />}
          color="purple"
        />
        <StatCard
          title={t("points")}
          value={totalPoints.toLocaleString()}
          icon={<Star size={20} />}
          color="amber"
        />
        <StatCard
          title={t("total_rents")}
          value={String(clients.reduce((s, c) => s + c.totalRents, 0))}
          icon={<Repeat size={20} />}
          color="blue"
        />
        <StatCard
          title={t("total_spent")}
          value={`${clients.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()} ${t("currency_symbol")}`}
          icon={<DollarSign size={20} />}
          color="green"
        />
      </div>

      <Card hover={false} className="mb-6">
        <div className="relative max-w-sm">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_client")}
            className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 rounded-2xl shimmer" />)}
        </div>
      ) : (
        <Table columns={columns} data={filtered} emptyMessage={t("no_loyalty_data")} />
      )}
    </motion.div>
  );
}
