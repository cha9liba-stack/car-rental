"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, DollarSign, CreditCard, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import Input, { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Payment } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addToCollection, collections } from "@/lib/firestore";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const paymentSchema = z.object({
  contractId: z.string().min(1, "Sélectionnez le contrat"),
  clientName: z.string().optional(),
  amount: z.coerce.number().min(1, "Le montant est requis"),
  paymentMethod: z.enum(["cash", "card", "transfer"]),
  paymentDate: z.string().min(1, "La date est requise"),
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
  cash: "Espèces",
  card: "Carte",
  transfer: "Virement",
};

const typeLabels: Record<string, string> = {
  payment: "Paiement",
  deposit: "Caution",
  return: "Remboursement",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<PaymentForm>({ resolver: paymentResolver });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, collections.payments), orderBy("createdAt", "desc")),
      (snapshot) => {
        setPayments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = payments.filter(
    (p) =>
      p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.contractId?.includes(search)
  );

  const onSubmit = async (data: PaymentForm) => {
    try {
      await addToCollection(collections.payments, data);
      toast.success("Paiement enregistré");
      setModalOpen(false);
      reset();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const columns = [
    {
      key: "clientName",
      header: "Client",
    },
    {
      key: "amount",
      header: "Montant",
      render: (p: Payment) => (
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Méthode",
      render: (p: Payment) => {
        const Icon = methodIcons[p.paymentMethod] || DollarSign;
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Icon size={14} className="text-gray-400" />
            {methodLabels[p.paymentMethod] || p.paymentMethod}
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      render: (p: Payment) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{typeLabels[p.type] || p.type}</span>
      ),
    },
    {
      key: "paymentDate",
      header: "Date",
      render: (p: Payment) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDateShort(p.paymentDate)}</span>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Suivi des paiements et cautions</p>
        </div>
        <Button onClick={() => { reset(); setModalOpen(true); }}>
          <Plus size={18} />
          Enregistrer un paiement
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
        <Table columns={columns} data={filtered} emptyMessage="Aucun paiement trouvé" />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau paiement" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Réf. contrat" id="contractId" error={errors.contractId?.message} {...register("contractId")} />
            <Input label="Nom du client" id="clientName" {...register("clientName")} />
            <Input label="Montant (MAD)" id="amount" type="number" error={errors.amount?.message} {...register("amount")} />
            <Input label="Date" id="paymentDate" type="date" {...register("paymentDate")} />
            <Select label="Méthode" options={[
              { value: "cash", label: "Espèces" },
              { value: "card", label: "Carte bancaire" },
              { value: "transfer", label: "Virement bancaire" },
            ]} {...register("paymentMethod")} />
            <Select label="Type" options={[
              { value: "payment", label: "Paiement" },
              { value: "deposit", label: "Caution" },
              { value: "return", label: "Remboursement" },
            ]} {...register("type")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" rows={3} {...register("notes")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
