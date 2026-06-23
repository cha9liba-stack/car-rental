"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/layout/language-provider";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  IdCard,
  MapPin,
  FileText,
  CreditCard,
  Calendar,
  Car,
} from "lucide-react";
import { Card, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDocument, getDocumentsByField, collections } from "@/lib/firestore";
import { Client, Contract, Payment } from "@/lib/types";
import { formatCurrency, formatDate, formatDateShort } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function ClientDetailPage() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const clientData = await getDocument<Client>(collections.clients, id);
        setClient(clientData);

        if (clientData) {
          const [contractsData, paymentsData] = await Promise.all([
            getDocumentsByField<Contract>(collections.contracts, "clientId", id),
            getDocumentsByField<Payment>(collections.payments, "clientName", clientData.name),
          ]);
          setContracts(contractsData);
          setPayments(paymentsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="h-10 w-48 rounded-2xl shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
      </motion.div>
    );
  }

  if (!client) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-24"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <IdCard size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("client_not_found")}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t("no_clients")}</p>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          {t("back_to_list")}
        </Link>
      </motion.div>
    );
  }

  const totalContractsAmount = contracts
    .filter((c) => c.status !== "cancelled")
    .reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const debt = Math.max(0, totalContractsAmount - totalPayments);

  const infoCards = [
    { icon: <Phone size={20} />, label: t("phone"), value: client.phone },
    { icon: <Mail size={20} />, label: t("email"), value: client.email || "-" },
    { icon: <IdCard size={20} />, label: t("cin"), value: client.cin },
    { icon: <MapPin size={20} />, label: t("address"), value: client.address || "-" },
    { icon: <FileText size={20} />, label: t("driver_license"), value: client.driverLicense || "-" },
    { icon: <FileText size={20} />, label: t("notes"), value: client.notes || "-" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/clients")}
          className="p-2 rounded-xl hover:bg-white/50 transition-colors"
        >
          <ArrowLeft size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("client_detail_desc")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {infoCards.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass-strong rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.06)]"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5 truncate">
                  {item.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {debt > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <StatCard
            title={t("outstanding_debt")}
            value={formatCurrency(debt)}
            icon={<AlertTriangle size={24} />}
            color="amber"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <StatCard
            title={t("outstanding_debt")}
            value={t("no_debt")}
            icon={<CheckCircle size={24} />}
            color="green"
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Car size={20} className="text-indigo-500" />
                {t("client_contracts")} ({contracts.length})
              </span>
            </CardTitle>
          </CardHeader>
          {contracts.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8">{t("no_client_contracts")}</p>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract, index) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{contract.carName}</p>
                      <Badge status={contract.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {formatDateShort(contract.startDate)} - {formatDateShort(contract.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={13} />
                        {formatCurrency(contract.totalAmount)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <CreditCard size={20} className="text-indigo-500" />
                {t("client_payments")} ({payments.length})
              </span>
            </CardTitle>
          </CardHeader>
          {payments.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8">{t("no_client_payments")}</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                      <Badge status={payment.type === "deposit" ? "pending" : payment.type === "return" ? "completed" : "paid"} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <CreditCard size={13} />
                        {payment.paymentMethod === "cash" ? t("cash") : payment.paymentMethod === "card" ? t("card") : t("transfer")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {formatDate(payment.paymentDate)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
