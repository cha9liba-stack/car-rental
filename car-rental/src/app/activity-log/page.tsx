"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLang } from "@/components/layout/language-provider";
import { AuditLog } from "@/lib/types";
import { formatAuditAction } from "@/services/auditService";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Download } from "lucide-react";

export default function ActivityLogPage() {
  const { t, lang } = useLang();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(200));
      const snap = await getDocs(q);
      setLogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AuditLog)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let items = logs;
    if (actionFilter) items = items.filter((l) => l.action === actionFilter);
    if (userFilter) items = items.filter((l) => l.userName === userFilter);
    if (timeFilter !== "all") {
      const now = new Date();
      const start = new Date(now);
      if (timeFilter === "today") start.setHours(0, 0, 0, 0);
      else if (timeFilter === "week") start.setDate(now.getDate() - 7);
      else if (timeFilter === "month") start.setMonth(now.getMonth() - 1);
      items = items.filter((l) => new Date(l.timestamp) >= start);
    }
    return items;
  }, [logs, actionFilter, userFilter, timeFilter]);

  const uniqueActions = useMemo(() => [...new Set(logs.map((l) => l.action))], [logs]);
  const uniqueUsers = useMemo(() => [...new Set(logs.map((l) => l.userName))], [logs]);

  const exportCSV = () => {
    const headers = [t("time"), t("action"), t("user"), t("target"), t("details")];
    const rows = filteredLogs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      formatAuditAction(l.action, lang),
      l.userName,
      l.targetLabel,
      l.details,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "time",
      header: t("time"),
      render: (l: AuditLog) => (
        <span className="text-gray-600 dark:text-gray-400 text-xs">
          {new Date(l.timestamp).toLocaleString(lang === "ar" ? "ar-TN" : "fr-FR")}
        </span>
      ),
    },
    {
      key: "action",
      header: t("action"),
      render: (l: AuditLog) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
          {formatAuditAction(l.action, lang)}
        </span>
      ),
    },
    {
      key: "userName",
      header: t("user"),
      render: (l: AuditLog) => <span className="font-medium text-gray-900 dark:text-white">{l.userName}</span>,
    },
    {
      key: "targetLabel",
      header: t("target"),
      render: (l: AuditLog) => <span className="text-gray-700 dark:text-gray-300">{l.targetLabel}</span>,
    },
    {
      key: "details",
      header: t("details"),
      render: (l: AuditLog) => <span className="text-gray-500 dark:text-gray-400 text-xs">{l.details}</span>,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("activity_log_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("activity_log_desc")}</p>
        </div>
        <Button onClick={exportCSV} variant="secondary" size="sm">
          <Download size={16} />
          {t("export")}
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            options={uniqueActions.map((a) => ({ value: a, label: formatAuditAction(a, lang) }))}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder={t("filter_by_action")}
          />
          <Select
            options={uniqueUsers.map((u) => ({ value: u, label: u }))}
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder={t("filter_by_user")}
          />
          <div className="flex gap-1.5 bg-white/50 dark:bg-white/5 rounded-xl p-1.5 border border-gray-200 dark:border-white/10">
            {(["all", "today", "week", "month"] as const).map((k) => (
              <button key={k} onClick={() => setTimeFilter(k)}
                className={`px-3.5 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium ${
                  timeFilter === k
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5"
                }`}
              >{t(k)}</button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 rounded-2xl shimmer" />)}
        </div>
      ) : (
        <Table columns={columns} data={filteredLogs} emptyMessage={t("no_results")} />
      )}
    </motion.div>
  );
}
