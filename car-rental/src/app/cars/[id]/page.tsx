"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLang } from "@/components/layout/language-provider";
import {
  ArrowLeft,
  Car,
  Edit2,
  Trash2,
  Calendar,
  Fuel,
  Gauge,
  Shield,
  Wrench,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input, { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Car as CarType,
  CarStatus,
  FuelType,
  Transmission,
  Maintenance,
  Contract,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getDocument,
  deleteDocument,
  updateDocument,
  addToCollection,
  collections,
} from "@/lib/firestore";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
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

export default function CarDetailPage() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<CarType | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>(
    []
  );
  const [contractRecords, setContractRecords] = useState<Contract[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarForm>({
    resolver,
    defaultValues: {
      status: "available",
      fuelType: "essence",
      transmission: "manuelle",
    },
  });

  useEffect(() => {
    if (!id) return;
    getDocument<CarType>(collections.cars, id).then((data) => {
      setCar(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const qMaintenance = query(
      collection(db, collections.maintenance),
      where("carId", "==", id),
      orderBy("date", "desc")
    );
    const unsubMaintenance = onSnapshot(qMaintenance, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Maintenance)
      );
      setMaintenanceRecords(data);
    });

    const qContracts = query(
      collection(db, collections.contracts),
      where("carId", "==", id),
      orderBy("startDate", "desc")
    );
    const unsubContracts = onSnapshot(qContracts, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Contract)
      );
      setContractRecords(data);
    });

    return () => {
      unsubMaintenance();
      unsubContracts();
    };
  }, [id]);

  const onSubmit = async (data: CarForm) => {
    try {
      await updateDocument(collections.cars, id, data);
      toast.success(t("car_updated"));
      setModalOpen(false);
      reset();
    } catch {
      toast.error(t("save_error"));
    }
  };

  const openEdit = () => {
    if (car) {
      reset(car as any);
      setModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (confirm(t("confirm_delete_car"))) {
      await deleteDocument(collections.cars, id);
      toast.success(t("car_deleted"));
      router.push("/cars");
    }
  };

  const fuelLabels: Record<string, string> = {
    essence: t("gasoline"),
    diesel: t("diesel"),
    electrique: t("electric"),
    hybride: t("hybrid"),
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-20">
        <Car
          size={48}
          className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
        />
        <p className="text-gray-400 dark:text-gray-500">{t("car_not_found")}</p>
        <Link
          href="/cars"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mt-2 inline-block font-medium"
        >
          {t("back_to_list")}
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/cars"
          className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {car.brand} {car.model}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {car.plateNumber}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge status={car.status} />
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Edit2 size={16} />
            {t("edit")}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={16} />
            {t("delete")}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("car_info")}</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <InfoItem
                label={t("brand")}
                value={car.brand}
                icon={<Car size={16} />}
              />
              <InfoItem
                label={t("model")}
                value={car.model}
                icon={<Car size={16} />}
              />
              <InfoItem
                label={t("year")}
                value={String(car.year)}
                icon={<Calendar size={16} />}
              />
              <InfoItem label={t("color")} value={car.color || "-"} />
              <InfoItem label={t("plate")} value={car.plateNumber} />
              <InfoItem label={t("chassis")} value={car.chassisNumber || "-"} />
              <InfoItem
                label={t("fuel")}
                value={fuelLabels[car.fuelType] || car.fuelType}
                icon={<Fuel size={16} />}
              />
              <InfoItem
                label={t("transmission")}
                value={
                  car.transmission === "manuelle" ? t("manual") : t("automatic")
                }
                icon={<Gauge size={16} />}
              />
              <InfoItem label={t("seats")} value={String(car.seats)} />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t("pricing")}</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <PriceRow
                label={t("per_day")}
                value={formatCurrency(car.pricePerDay)}
              />
              <PriceRow
                label={t("per_week")}
                value={
                  car.pricePerWeek
                    ? formatCurrency(car.pricePerWeek)
                    : "-"
                }
              />
              <PriceRow
                label={t("per_month")}
                value={
                  car.pricePerMonth
                    ? formatCurrency(car.pricePerMonth)
                    : "-"
                }
              />
              <div className="pt-3 border-t border-white/10">
                <PriceRow
                  label={t("deposit")}
                  value={formatCurrency(car.depositAmount)}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dates")}</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <InfoItem
                label={t("insurance")}
                value={
                  car.insuranceExpiryDate
                    ? formatDate(car.insuranceExpiryDate)
                    : "-"
                }
                icon={<Shield size={16} />}
              />
              <InfoItem
                label={t("inspection")}
                value={
                  car.technicalInspectionDate
                    ? formatDate(car.technicalInspectionDate)
                    : "-"
                }
                icon={<Calendar size={16} />}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Notes */}
      {car.notes && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t("notes")}</CardTitle>
          </CardHeader>
          <p className="text-gray-600 dark:text-gray-400">{car.notes}</p>
        </Card>
      )}

      {/* Maintenance History */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench size={18} className="text-indigo-500" />
            {t("maintenance_history")}
          </CardTitle>
        </CardHeader>
        {maintenanceRecords.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm py-2">
            {t("no_maintenance_records")}
          </p>
        ) : (
          <div className="space-y-3">
            {maintenanceRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-gray-100 dark:border-white/10"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {record.type}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(record.date)}
                    {record.garage && ` - ${record.garage}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(record.cost)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Contract History */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" />
            {t("contract_history")}
          </CardTitle>
        </CardHeader>
        {contractRecords.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm py-2">
            {t("no_contract_history")}
          </p>
        ) : (
          <div className="space-y-3">
            {contractRecords.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-gray-100 dark:border-white/10"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {contract.clientName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(contract.startDate)} →{" "}
                    {formatDate(contract.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(contract.totalAmount)}
                  </span>
                  <Badge status={contract.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title={t("edit_car")}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t("brand")}
              id="brand"
              error={errors.brand?.message}
              {...register("brand")}
              placeholder={t("example_brand")}
            />
            <Input
              label={t("model")}
              id="model"
              error={errors.model?.message}
              {...register("model")}
              placeholder={t("example_model")}
            />
            <Input
              label={t("year")}
              id="year"
              type="number"
              error={errors.year?.message}
              {...register("year")}
            />
            <Input
              label={t("plate")}
              id="plateNumber"
              error={errors.plateNumber?.message}
              {...register("plateNumber")}
            />
            <Input
              label={t("chassis")}
              id="chassisNumber"
              {...register("chassisNumber")}
            />
            <Input label={t("color")} id="color" {...register("color")} />
            <Select
              label={t("fuel")}
              options={[
                { value: "essence", label: t("gasoline") },
                { value: "diesel", label: t("diesel") },
                { value: "electrique", label: t("electric") },
                { value: "hybride", label: t("hybrid") },
              ]}
              {...register("fuelType")}
            />
            <Select
              label={t("transmission")}
              options={[
                { value: "manuelle", label: t("manual") },
                { value: "automatique", label: t("automatic") },
              ]}
              {...register("transmission")}
            />
            <Input
              label={t("seats")}
              id="seats"
              type="number"
              {...register("seats")}
            />
            <Input
              label={t("price_per_day")}
              id="pricePerDay"
              type="number"
              error={errors.pricePerDay?.message}
              {...register("pricePerDay")}
            />
            <Input
              label={t("price_per_week")}
              id="pricePerWeek"
              type="number"
              {...register("pricePerWeek")}
            />
            <Input
              label={t("price_per_month")}
              id="pricePerMonth"
              type="number"
              {...register("pricePerMonth")}
            />
            <Input
              label={t("deposit")}
              id="depositAmount"
              type="number"
              {...register("depositAmount")}
            />
            <Input
              label={t("insurance")}
              id="insuranceExpiryDate"
              type="date"
              {...register("insuranceExpiryDate")}
            />
            <Input
              label={t("inspection")}
              id="technicalInspectionDate"
              type="date"
              {...register("technicalInspectionDate")}
            />
            <Select
              label={t("status")}
              options={[
                { value: "available", label: t("available") },
                { value: "rented", label: t("rented") },
                { value: "maintenance", label: t("maintenance_s") },
                { value: "retired", label: t("retired") },
              ]}
              {...register("status")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("notes")}
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              rows={3}
              {...register("notes")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("update")}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}
