"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/layout/language-provider";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Car as CarIcon,
  Gauge,
  Fuel,
  Calendar,
  Edit2,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import Input, { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Car, CarStatus, FuelType, Transmission } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logAction } from "@/services/auditService";
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
import Link from "next/link";

const carSchema = z.object({
  brand: z.string().min(2, "العلامة التجارية مطلوبة"),
  model: z.string().min(1, "الطراز مطلوب"),
  year: z.coerce.number().min(2000, "سنة غير صالحة").max(2030),
  plateNumber: z.string().min(4, "رقم اللوحة مطلوب"),
  chassisNumber: z.string().optional(),
  color: z.string().optional(),
  fuelType: z.enum(["essence", "diesel", "electrique", "hybride"]),
  seats: z.coerce.number().min(1).max(15),
  doors: z.coerce.number().min(2).max(7),
  transmission: z.enum(["manuelle", "automatique"]),
  pricePerDay: z.coerce.number().min(0, "السعر مطلوب"),
  pricePerWeek: z.coerce.number().min(0).optional(),
  pricePerMonth: z.coerce.number().min(0).optional(),
  depositAmount: z.coerce.number().min(0).optional(),
  status: z.enum(["available", "rented", "maintenance", "retired"]),
  insuranceExpiryDate: z.string().optional(),
  technicalInspectionDate: z.string().optional(),
  notes: z.string().optional(),
});

type CarForm = z.infer<typeof carSchema>;
const resolver = zodResolver(carSchema) as any;

export default function CarsPage() {
  const { t } = useLang();
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarForm>({
    resolver,
    defaultValues: { status: "available", fuelType: "essence", transmission: "manuelle" },
  });

  useEffect(() => {
    const q = query(collection(db, collections.cars), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Car));
      setCars(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = cars.filter((c) => {
    const matchSearch =
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.model.toLowerCase().includes(search.toLowerCase()) ||
      c.plateNumber.includes(search);
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const onSubmit = async (data: CarForm) => {
    try {
      if (editing) {
        await updateDocument(collections.cars, editing.id, data);
        await logAction("update_car", "admin", editing.id, `${editing.brand} ${editing.model} (${editing.plateNumber})`, "");
        toast.success(t("car_updated"));
      } else {
        const newId = await addToCollection(collections.cars, data);
        await logAction("create_car", "admin", newId, `${data.brand} ${data.model} (${data.plateNumber})`, "");
        toast.success(t("car_added"));
      }
      setModalOpen(false);
      setEditing(null);
      reset();
    } catch {
      toast.error(t("save_error"));
    }
  };

  const openEdit = (car: Car) => {
    setEditing(car);
    reset(car);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    reset({ status: "available", fuelType: "essence", transmission: "manuelle" });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("confirm_delete_car"))) {
      try {
        const deletedCar = cars.find((c) => c.id === id);
        const carName = deletedCar ? `${deletedCar.brand} ${deletedCar.model} (${deletedCar.plateNumber})` : "";
        await deleteDocument(collections.cars, id);
        await logAction("delete_car", "admin", id, carName, "");
        toast.success(t("car_deleted"));
      } catch {
        toast.error(t("delete_error"));
      }
    }
  };

  const fuelLabels: Record<string, string> = {
    essence: t("gasoline"), diesel: t("diesel"), electrique: t("electric"), hybride: t("hybrid"),
  };
  const transmissionLabels: Record<string, string> = {
    manuelle: t("manual"), automatique: t("automatic"),
  };

  const columns = [
    {
      key: "name",
      header: t("vehicle"),
      render: (c: Car) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <CarIcon size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {c.brand} {c.model}
            </p>
            <p className="text-xs text-gray-400">{c.plateNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: "year",
      header: t("year"),
      render: (c: Car) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={14} className="text-gray-400" />
          {c.year}
        </div>
      ),
    },
    {
      key: "fuelType",
      header: t("fuel"),
      render: (c: Car) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Fuel size={14} className="text-gray-400" />
          {fuelLabels[c.fuelType] || c.fuelType}
        </div>
      ),
    },
    {
      key: "transmission",
      header: t("transmission"),
      render: (c: Car) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Gauge size={14} className="text-gray-400" />
          {transmissionLabels[c.transmission] || c.transmission}
        </div>
      ),
    },
    {
      key: "pricePerDay",
      header: t("price_per_day"),
      render: (c: Car) => (
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(c.pricePerDay)}</span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (c: Car) => <Badge status={c.status} />,
    },
    {
      key: "actions",
      header: t("actions"),
      render: (c: Car) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/cars/${c.id}`}
            className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Edit2 size={16} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("cars_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("cars_desc")}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} />
          {t("add_car")}
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("search_car")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <Select
            options={[
              { value: "", label: t("all_status") },
              { value: "available", label: t("available") },
              { value: "rented", label: t("rented") },
              { value: "maintenance", label: t("maintenance_s") },
              { value: "retired", label: t("retired") },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
        <Table columns={columns} data={filtered} emptyMessage={t("no_cars")} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? t("edit_car") : t("add_car")}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label={t("brand")} id="brand" error={errors.brand?.message} {...register("brand")} placeholder={t("example_brand")} />
            <Input label={t("model")} id="model" error={errors.model?.message} {...register("model")} placeholder={t("example_model")} />
            <Input label={t("year")} id="year" type="number" error={errors.year?.message} {...register("year")} />
            <Input label={t("plate")} id="plateNumber" error={errors.plateNumber?.message} {...register("plateNumber")} />
            <Input label={t("chassis")} id="chassisNumber" {...register("chassisNumber")} />
            <Input label={t("color")} id="color" {...register("color")} />
            <Select label={t("fuel")} options={[
              { value: "essence", label: t("gasoline") },
              { value: "diesel", label: t("diesel") },
              { value: "electrique", label: t("electric") },
              { value: "hybride", label: t("hybrid") },
            ]} {...register("fuelType")} />
            <Select label={t("transmission")} options={[
              { value: "manuelle", label: t("manual") },
              { value: "automatique", label: t("automatic") },
            ]} {...register("transmission")} />
            <Input label={t("seats")} id="seats" type="number" {...register("seats")} />
            <Input label={t("price_per_day")} id="pricePerDay" type="number" error={errors.pricePerDay?.message} {...register("pricePerDay")} />
            <Input label={t("price_per_week")} id="pricePerWeek" type="number" {...register("pricePerWeek")} />
            <Input label={t("price_per_month")} id="pricePerMonth" type="number" {...register("pricePerMonth")} />
            <Input label={t("deposit")} id="depositAmount" type="number" {...register("depositAmount")} />
            <Input label={t("insurance")} id="insuranceExpiryDate" type="date" {...register("insuranceExpiryDate")} />
            <Input label={t("inspection")} id="technicalInspectionDate" type="date" {...register("technicalInspectionDate")} />
            <Select label={t("status")} options={[
              { value: "available", label: t("available") },
              { value: "rented", label: t("rented") },
              { value: "maintenance", label: t("maintenance_s") },
              { value: "retired", label: t("retired") },
            ]} {...register("status")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("notes")}</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" rows={3} {...register("notes")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>{t("cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("saving") : editing ? t("update") : t("add")}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
