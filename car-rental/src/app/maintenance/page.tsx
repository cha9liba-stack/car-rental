"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Wrench,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import Input, { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Maintenance } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  addToCollection,
  updateDocument,
  deleteDocument,
  collections,
} from "@/lib/firestore";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLang } from "@/components/layout/language-provider";

const maintenanceSchema = z.object({
  carName: z.string().min(1, "اسم السيارة مطلوب"),
  type: z.string().min(1, "نوع الصيانة مطلوب"),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, "يجب أن تكون التكلفة 0 أو أكثر"),
  date: z.string().min(1, "التاريخ مطلوب"),
  garage: z.string().min(1, "الكراج مطلوب"),
  nextMaintenanceDate: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceForm = z.infer<typeof maintenanceSchema>;
const maintenanceResolver = zodResolver(maintenanceSchema) as any;

const maintenanceTypes = [
  { value: "صيانة دورية", label: "maintenance_periodic" },
  { value: "إصلاح", label: "maintenance_repair" },
  { value: "تغيير زيت", label: "maintenance_oil_change" },
  { value: "إطارات", label: "maintenance_tires" },
  { value: "فرامل", label: "maintenance_brakes" },
  { value: "بطارية", label: "maintenance_battery" },
  { value: "مكيف", label: "maintenance_ac" },
  { value: "أخرى", label: "maintenance_other" },
];

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    "صيانة دورية": "bg-indigo-100/80 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    "إصلاح": "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    "تغيير زيت": "bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    "إطارات": "bg-cyan-100/80 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
    "فرامل": "bg-rose-100/80 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    "بطارية": "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    "مكيف": "bg-orange-100/80 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    "أخرى": "bg-gray-100/80 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
  };
  return colors[type] || colors["أخرى"];
}

function getStatusBadge(date: string, nextDate?: string, t?: (key: string) => string) {
  const today = new Date();
  const maintenanceDate = new Date(date);
  const isPast = maintenanceDate <= today;
  const tt = t || ((k: string) => k);
  if (isPast && (!nextDate || new Date(nextDate) <= today)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {tt("done")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {tt("scheduled")}
    </span>
  );
}

export default function MaintenancePage() {
  const { t } = useLang();
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceForm>({
    resolver: maintenanceResolver,
  });

  useEffect(() => {
    const q = query(
      collection(db, collections.maintenance),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Maintenance)
      );
      setRecords(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = records.filter(
    (r) =>
      r.carName.toLowerCase().includes(search.toLowerCase()) ||
      r.type.includes(search) ||
      r.garage.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: MaintenanceForm) => {
    try {
      if (editing) {
        await updateDocument(collections.maintenance, editing.id, data);
        toast.success(t("maintenance_updated"));
      } else {
        await addToCollection(collections.maintenance, data);
        toast.success(t("maintenance_added"));
      }
      setModalOpen(false);
      setEditing(null);
      reset();
    } catch {
      toast.error(t("save_error"));
    }
  };

  const openEdit = (record: Maintenance) => {
    setEditing(record);
    reset({
      carName: record.carName,
      type: record.type,
      description: record.description || "",
      cost: record.cost,
      date: record.date,
      garage: record.garage,
      nextMaintenanceDate: record.nextMaintenanceDate || "",
      notes: record.notes || "",
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    reset({
      carName: "",
      type: "",
      description: "",
      cost: 0,
      date: "",
      garage: "",
      nextMaintenanceDate: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("delete_maintenance_confirm"))) {
      try {
        await deleteDocument(collections.maintenance, id);
        toast.success(t("maintenance_deleted"));
      } catch {
        toast.error(t("delete_error"));
      }
    }
  };

  const columns = [
    {
      key: "carName",
      header: t("vehicle"),
      render: (r: Maintenance) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
            <Wrench size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{r.carName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: t("type"),
      render: (r: Maintenance) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getTypeBadge(r.type)}`}>
          {r.type}
        </span>
      ),
    },
    {
      key: "cost",
      header: t("cost"),
      render: (r: Maintenance) => (
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatCurrency(r.cost)}
        </span>
      ),
    },
    {
      key: "date",
      header: t("date"),
      render: (r: Maintenance) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(r.date)}
        </span>
      ),
    },
    {
      key: "garage",
      header: t("garage"),
      render: (r: Maintenance) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {r.garage}
        </span>
      ),
    },
    {
      key: "nextMaintenanceDate",
      header: t("next_maintenance"),
      render: (r: Maintenance) =>
        r.nextMaintenanceDate ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(r.nextMaintenanceDate)}
          </span>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">-</span>
        ),
    },
    {
      key: "status",
      header: t("status"),
      render: (r: Maintenance) => getStatusBadge(r.date, r.nextMaintenanceDate, t),
    },
    {
      key: "actions",
      header: t("actions"),
      render: (r: Maintenance) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("maintenance_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("maintenance_desc")}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} />
          {t("add_maintenance")}
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t("search_maintenance")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl shimmer" />
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          emptyMessage={t("no_maintenance")}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? t("edit_maintenance") : t("add_maintenance")}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("car_name")}
              id="carName"
              error={errors.carName?.message}
              {...register("carName")}
            />
            <Select
              label={t("maintenance_type")}
              id="type"
              error={errors.type?.message}
              options={maintenanceTypes.map(mt => ({ ...mt, label: t(mt.label) }))}
              placeholder={t("select_type")}
              value={editing?.type || ""}
              onChange={(e) => setValue("type", e.target.value)}
            />
            <Input
              label={t("date")}
              id="date"
              type="date"
              error={errors.date?.message}
              {...register("date")}
            />
            <Input
              label={t("cost")}
              id="cost"
              type="number"
              step="0.001"
              error={errors.cost?.message}
              {...register("cost")}
            />
            <Input
              label={t("garage")}
              id="garage"
              error={errors.garage?.message}
              {...register("garage")}
            />
            <Input
              label={t("next_maintenance")}
              id="nextMaintenanceDate"
              type="date"
              {...register("nextMaintenanceDate")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("description")}</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              rows={3}
              {...register("description")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("notes")}</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              rows={3}
              {...register("notes")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : editing ? t("update") : t("add")}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
