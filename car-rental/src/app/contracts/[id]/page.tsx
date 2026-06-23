"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Edit2, Calendar, DollarSign, User, Car, CreditCard, Building2, ShieldCheck, ShieldX } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input, { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Contract, Payment } from "@/lib/types";
import { formatCurrency, formatDate, formatDateShort, formatDateInput } from "@/lib/utils";
import { getDocument, updateDocument, collections } from "@/lib/firestore";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useLang } from "@/components/layout/language-provider";
import { logAction } from "@/services/auditService";

const editSchema = z.object({
  status: z.enum(["active", "completed", "cancelled"]),
  returnDate: z.string().optional(),
  depositReturned: z.boolean(),
  notes: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;
const editResolver = zodResolver(editSchema) as any;

const methodLabels: Record<string, string> = {
  cash: "cash",
  card: "card",
  transfer: "transfer",
};

const typeLabels: Record<string, string> = {
  payment: "payment_type",
  deposit: "deposit_type",
  return: "return_type",
};

const methodIcons: Record<string, any> = {
  cash: DollarSign,
  card: CreditCard,
  transfer: Building2,
};

const statusLabels: Record<string, string> = {
  active: "active",
  completed: "completed",
  cancelled: "cancelled",
};

export default function ContractDetailPage() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: editResolver,
  });

  const watchDepositReturned = watch("depositReturned");

  const totalPaid = payments
    .filter((p) => p.type === "payment")
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = contract ? contract.totalAmount - totalPaid : 0;

  useEffect(() => {
    getDocument<Contract>(collections.contracts, id).then((data) => {
      setContract(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!contract) return;
    const q = query(
      collection(db, collections.payments),
      where("contractId", "==", id),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)));
    });
    return unsub;
  }, [id, contract]);

  const openEditModal = () => {
    if (!contract) return;
    reset({
      status: contract.status,
      returnDate: formatDateInput(contract.returnDate),
      depositReturned: contract.depositReturned,
      notes: contract.notes || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (data: EditForm) => {
    try {
      await updateDocument(collections.contracts, id, data);
      toast.success(t("contract_updated"));
      setEditModalOpen(false);
    } catch {
      toast.error(t("contract_update_error"));
    }
  };

  const handleCancel = async () => {
    if (!contract) return;
    if (!confirm(t("cancel_contract_confirm"))) return;
    try {
      await updateDocument(collections.contracts, id, { status: "cancelled" });
      await updateDocument(collections.cars, contract.carId, { status: "available" });
      await logAction("cancel_contract", "admin", id, `#${id.slice(-6)} - ${contract.clientName}`, "");
      toast.success(t("contract_cancelled"));
    } catch {
      toast.error(t("contract_cancel_error"));
    }
  };

  const handleComplete = async () => {
    if (!contract) return;
    try {
      await updateDocument(collections.contracts, id, {
        status: "completed",
        returnDate: new Date().toISOString(),
      });
      await updateDocument(collections.cars, contract.carId, { status: "available" });
      await logAction("complete_contract", "admin", id, `#${id.slice(-6)} - ${contract.clientName}`, "");
      toast.success(t("contract_completed"));
    } catch {
      toast.error(t("contract_complete_error"));
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
        <div className="h-48 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!contract) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-xl font-medium text-gray-400 dark:text-gray-500 mb-2">{t("contract_not_found")}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">{t("contract_not_found_desc")}</p>
        <Link
          href="/contracts"
          className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft size={16} />
          {t("back_to_list")}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/contracts"
          className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("contract_detail")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {contract.clientName} - {contract.carName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={contract.status} />
          <Button variant="outline" size="sm" onClick={openEditModal}>
            <Edit2 size={16} />
            {t("edit")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("contract_info")}</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <InfoItem label={t("client")} value={contract.clientName} icon={<User size={16} />} />
              <InfoItem label={t("vehicle")} value={contract.carName} icon={<Car size={16} />} />
              <InfoItem label={t("start_date")} value={formatDate(contract.startDate)} icon={<Calendar size={16} />} />
              <InfoItem label={t("end_date")} value={formatDate(contract.endDate)} icon={<Calendar size={16} />} />
              <InfoItem
                label={t("return_date")}
                value={contract.returnDate ? formatDate(contract.returnDate) : "-"}
                icon={<Calendar size={16} />}
              />
              <InfoItem label={t("rental_days")} value={`${contract.rentalDays} ${t("days")}`} />
              <InfoItem label={t("price_per_day")} value={formatCurrency(contract.pricePerDay)} icon={<DollarSign size={16} />} />
              <InfoItem label={t("total_amount")} value={formatCurrency(contract.totalAmount)} icon={<DollarSign size={16} />} />
              <InfoItem
                label={t("remaining_balance")}
                value={formatCurrency(Math.max(0, remaining))}
                icon={<DollarSign size={16} />}
              />
              <InfoItem label={t("deposit")} value={formatCurrency(contract.depositAmount)} icon={<ShieldCheck size={16} />} />
              <InfoItem
                label={t("deposit_returned")}
                value={contract.depositReturned ? t("yes") : t("no")}
                icon={contract.depositReturned ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t("status")}</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t("status")}</span>
                <Badge status={contract.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t("start_date")}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateShort(contract.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t("end_date")}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateShort(contract.endDate)}
                </span>
              </div>
            </div>
          </Card>

          <Card hover={false} className="space-y-3">
            {contract.status === "active" && (
              <>
                <Button className="w-full" onClick={handleComplete}>
                  {t("complete_contract")}
                </Button>
                <Button variant="danger" className="w-full" onClick={handleCancel}>
                  {t("cancel_contract")}
                </Button>
              </>
            )}
            {contract.status === "completed" && (
              <div className="py-2 text-center">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{t("contract_completed")}</span>
              </div>
            )}
            {contract.status === "cancelled" && (
              <div className="py-2 text-center">
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">{t("contract_cancelled")}</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {contract.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("notes")}</CardTitle>
          </CardHeader>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{contract.notes}</p>
        </Card>
      )}

      {contract.registration || contract.contractNumber ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>{t("vehicle_tab")}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {contract.contractNumber && <InfoItem label={t("contract_number")} value={contract.contractNumber} />}
            {contract.registration && <InfoItem label={t("registration")} value={contract.registration} />}
            {contract.brand && <InfoItem label={t("brand")} value={contract.brand} />}
            {contract.model && <InfoItem label={t("model")} value={contract.model} />}
            {contract.category && <InfoItem label={t("category")} value={contract.category} />}
            {contract.fuelType && <InfoItem label={t("fuel_type")} value={contract.fuelType} />}
            {contract.departureDate && <InfoItem label={t("departure_date")} value={formatDate(contract.departureDate)} />}
            {contract.departureTime && <InfoItem label={t("departure_time")} value={contract.departureTime} />}
            {contract.departurePlace && <InfoItem label={t("departure_place")} value={contract.departurePlace} />}
            {contract.departureKm && <InfoItem label={t("departure_km")} value={contract.departureKm} />}
            {contract.returnKm && <InfoItem label={t("return_km")} value={contract.returnKm} />}
            {contract.remiseRetour && <InfoItem label={t("remise_retour")} value={contract.remiseRetour} />}
          </div>
        </Card>
      ) : null}

      {contract.driverName || contract.driverCin ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>{t("driver_tab")}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoItem label={t("driver_name")} value={contract.driverName || contract.clientName} />
            {contract.driverPhone && <InfoItem label={t("driver_phone")} value={contract.driverPhone} />}
            {contract.driverCin && <InfoItem label={t("driver_cin")} value={contract.driverCin} />}
            {contract.driverCinDate && <InfoItem label={t("driver_cin_date")} value={formatDate(contract.driverCinDate)} />}
            {contract.driverCinPlace && <InfoItem label={t("driver_cin_place")} value={contract.driverCinPlace} />}
            {contract.driverDob && <InfoItem label={t("driver_dob")} value={formatDate(contract.driverDob)} />}
            {contract.driverBirthPlace && <InfoItem label={t("driver_birth_place")} value={contract.driverBirthPlace} />}
            {contract.driverAddress && <InfoItem label={t("driver_address")} value={contract.driverAddress} />}
            {contract.driverLicense && <InfoItem label={t("driver_license")} value={contract.driverLicense} />}
            {contract.driverLicenseDate && <InfoItem label={t("driver_license_date")} value={formatDate(contract.driverLicenseDate)} />}
            {contract.driverLicensePlace && <InfoItem label={t("driver_license_place")} value={contract.driverLicensePlace} />}
          </div>
        </Card>
      ) : null}

      {contract.hasDriver2 && contract.driver2Name ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>{t("driver2_tab")}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoItem label={t("driver2_name")} value={contract.driver2Name} />
            {contract.driver2Phone && <InfoItem label={t("driver2_phone")} value={contract.driver2Phone} />}
            {contract.driver2Cin && <InfoItem label={t("driver2_cin")} value={contract.driver2Cin} />}
            {contract.driver2CinDate && <InfoItem label={t("driver2_cin_date")} value={formatDate(contract.driver2CinDate)} />}
            {contract.driver2CinPlace && <InfoItem label={t("driver2_cin_place")} value={contract.driver2CinPlace} />}
            {contract.driver2Dob && <InfoItem label={t("driver2_dob")} value={formatDate(contract.driver2Dob)} />}
            {contract.driver2BirthPlace && <InfoItem label={t("driver2_birth_place")} value={contract.driver2BirthPlace} />}
            {contract.driver2Address && <InfoItem label={t("driver2_address")} value={contract.driver2Address} />}
            {contract.driver2License && <InfoItem label={t("driver2_license")} value={contract.driver2License} />}
            {contract.driver2LicenseDate && <InfoItem label={t("driver2_license_date")} value={formatDate(contract.driver2LicenseDate)} />}
            {contract.driver2LicensePlace && <InfoItem label={t("driver2_license_place")} value={contract.driver2LicensePlace} />}
          </div>
        </Card>
      ) : null}

      {contract.totalFacture ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>{t("financial_tab")}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoItem label={t("total_facture")} value={contract.totalFacture} />
            {contract.divers && <InfoItem label={t("divers")} value={contract.divers} />}
            {contract.prep && <InfoItem label={t("prep")} value={contract.prep} />}
            {contract.depot && <InfoItem label={t("depot")} value={contract.depot} />}
            {contract.depotGarantie && <InfoItem label={t("depot_garantie")} value={contract.depotGarantie} />}
            {contract.totalPartiel && <InfoItem label={t("total_partiel")} value={contract.totalPartiel} />}
            {contract.totalHT && <InfoItem label={t("total_ht")} value={contract.totalHT} />}
            {contract.tva && <InfoItem label={t("tva")} value={contract.tva} />}
            {contract.somme && <InfoItem label={t("somme")} value={contract.somme} />}
            {contract.resteAPayer && <InfoItem label={t("reste_a_payer")} value={contract.resteAPayer} />}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("contract_payments")}</CardTitle>
          <Link href="/payments">
            <Button size="sm" variant="outline">
              {t("add_payment")}
            </Button>
          </Link>
        </CardHeader>
        {payments.length === 0 ? (
          <p className="text-center py-8 text-gray-400 dark:text-gray-500">{t("no_payments_for_contract")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/30 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("amount")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("method")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("type")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("date")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p, index) => {
                  const Icon = methodIcons[p.paymentMethod] || DollarSign;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="transition-all duration-150 hover:bg-white/40 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(p.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Icon size={14} className="text-gray-400" />
                          {t(methodLabels[p.paymentMethod] || p.paymentMethod)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t(typeLabels[p.type] || p.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateShort(p.paymentDate)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={t("edit_contract")} size="lg">
        <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t("status")}
              options={[
                { value: "active", label: t("active") },
                { value: "completed", label: t("completed") },
                { value: "cancelled", label: t("cancelled") },
              ]}
              value={watch("status")}
              onChange={(e) => setValue("status", e.target.value as "active" | "completed" | "cancelled")}
            />
            <Input
              label={t("return_date")}
              id="editReturnDate"
              type="date"
              {...register("returnDate")}
              error={errors.returnDate?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("deposit_returned")}
            </label>
            <button
              type="button"
              onClick={() => setValue("depositReturned", !watchDepositReturned)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 w-full ${
                watchDepositReturned
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600"
                  : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                  watchDepositReturned
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {watchDepositReturned && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  watchDepositReturned
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {watchDepositReturned ? t("deposit_returned_yes") : t("deposit_returned_no")}
              </span>
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("notes")}</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              rows={4}
              {...register("notes")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("save_changes")}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function FileText({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
