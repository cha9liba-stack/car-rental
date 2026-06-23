"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  DollarSign,
  CreditCard,
  Building2,
  Trash2,
  Edit2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import Input, { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Contract, Payment } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/utils";
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
import { logAction } from "@/services/auditService";
import { useLang } from "@/components/layout/language-provider";

const paymentSchema = z.object({
  contractId: z.string().min(1, "اختر العقد"),
  clientName: z.string().optional(),
  amount: z.coerce.number().min(1, "المبلغ مطلوب"),
  paymentMethod: z.enum(["cash", "card", "transfer"]),
  paymentDate: z.string().min(1, "التاريخ مطلوب"),
  type: z.enum(["payment", "deposit", "return"]),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;
const paymentResolver = zodResolver(paymentSchema) as any;

const methodIcons: Record<string, any> = {
  cash: DollarSign,
  card: CreditCard,
  transfer: Building2,
};

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

export default function PaymentsPage() {
  const { t } = useLang();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentForm>({ resolver: paymentResolver });

  const selectedContractId = watch("contractId");

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, collections.payments), orderBy("createdAt", "desc")),
      (snapshot) => {
        setPayments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)));
        setLoading(false);
      }
    );
    const unsub2 = onSnapshot(collection(db, collections.contracts), (snapshot) => {
      setContracts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Contract)));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const filtered = payments.filter(
    (p) =>
      p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.contractId?.includes(search)
  );

  const onSubmit = async (data: PaymentForm) => {
    try {
      if (editing) {
        await updateDocument(collections.payments, editing.id, data);
        await logAction("update_payment", "admin", editing.id, `تعديل دفعة`, "");
        toast.success(t("payment_updated"));
      } else {
        const newId = await addToCollection(collections.payments, data);
        await logAction("create_payment", "admin", newId, `دفعة ${data.amount} ${t("currency_symbol")}`, data.clientName || "");
        toast.success(t("payment_added"));
      }
      setModalOpen(false);
      setEditing(null);
      reset();
    } catch {
      toast.error(t("save_error"));
    }
  };

  const openEdit = (payment: Payment) => {
    setEditing(payment);
    reset(payment);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    reset({
      contractId: "",
      clientName: "",
      amount: 0 as any,
      paymentMethod: "cash",
      paymentDate: "",
      type: "payment",
      notes: "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("delete_payment_confirm"))) {
      try {
        await deleteDocument(collections.payments, id);
        await logAction("delete_payment", "admin", id, `حذف دفعة`, "");
        toast.success(t("payment_deleted"));
      } catch {
        toast.error(t("delete_error"));
      }
    }
  };

  const columns = [
    {
      key: "clientName",
      header: t("client"),
    },
    {
      key: "amount",
      header: t("amount"),
      render: (p: Payment) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(p.amount)}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: t("method"),
      render: (p: Payment) => {
        const Icon = methodIcons[p.paymentMethod] || DollarSign;
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Icon size={14} className="text-gray-400" />
            {t(methodLabels[p.paymentMethod] || p.paymentMethod)}
          </div>
        );
      },
    },
    {
      key: "type",
      header: t("type"),
      render: (p: Payment) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t(typeLabels[p.type] || p.type)}
        </span>
      ),
    },
    {
      key: "paymentDate",
      header: t("date"),
      render: (p: Payment) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDateShort(p.paymentDate)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      render: (p: Payment) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
            className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(p.id);
            }}
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
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("payments_title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("payments_desc")}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} />
          {t("add_payment")}
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-2xl shimmer" />
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          emptyMessage={t("no_payments")}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? t("edit_payment") : t("new_payment")}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t("ref_contract")}
              options={contracts.map((c) => ({
                value: c.id,
                label: `#${c.id.slice(-6)} - ${c.clientName} - ${c.carName}`,
              }))}
              value={selectedContractId || ""}
              onChange={(e) => {
                setValue("contractId", e.target.value);
                const contract = contracts.find((c) => c.id === e.target.value);
                if (contract) setValue("clientName", contract.clientName);
              }}
              placeholder={t("select_contract")}
            />
            <Input
              label={t("client_name")}
              id="clientName"
              {...register("clientName")}
              readOnly
            />
            <Input
              label={t("amount")}
              id="amount"
              type="number"
              error={errors.amount?.message}
              {...register("amount")}
            />
            <Input
              label={t("date")}
              id="paymentDate"
              type="date"
              error={errors.paymentDate?.message}
              {...register("paymentDate")}
            />
            <Select
              label={t("method")}
              options={[
                { value: "cash", label: t("cash") },
                { value: "card", label: t("card") },
                { value: "transfer", label: t("transfer") },
              ]}
              {...register("paymentMethod")}
            />
            <Select
              label={t("type")}
              options={[
                { value: "payment", label: t("payment_type") },
                { value: "deposit", label: t("deposit_type") },
                { value: "return", label: t("return_type") },
              ]}
              {...register("type")}
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
                setEditing(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("saving")
                : editing
                ? t("update")
                : t("save")}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
