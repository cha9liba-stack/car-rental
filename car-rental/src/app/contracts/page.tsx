"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  DollarSign,
  User,
  Car,
  IdCard,
  CreditCard,
  MapPin,
  Fuel,
  Gauge,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import Input, { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Client, Car as CarType, Contract } from "@/lib/types";
import { formatCurrency, formatDateShort, calculateRentalDays } from "@/lib/utils";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  addToCollection,
  updateDocument,
  collections,
} from "@/lib/firestore";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLang } from "@/components/layout/language-provider";
import { logAction } from "@/services/auditService";
import { addPoints } from "@/services/loyaltyService";

const contractSchema = z.object({
  clientId: z.string().min(1, "اختر عميلاً"),
  clientName: z.string(),
  carId: z.string().min(1, "اختر سيارة"),
  carName: z.string(),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  pricePerDay: z.coerce.number().min(0),
  totalAmount: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
  contractNumber: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  registration: z.string().optional(),
  departureDate: z.string().optional(),
  departureTime: z.string().optional(),
  departurePlace: z.string().optional(),
  departureKm: z.string().optional(),
  returnKm: z.string().optional(),
  fuelType: z.string().optional(),
  remiseRetour: z.string().optional(),
  driverName: z.string().optional(),
  driverDob: z.string().optional(),
  driverBirthPlace: z.string().optional(),
  driverAddress: z.string().optional(),
  driverPhone: z.string().optional(),
  driverCin: z.string().optional(),
  driverCinDate: z.string().optional(),
  driverCinPlace: z.string().optional(),
  driverLicense: z.string().optional(),
  driverLicenseDate: z.string().optional(),
  driverLicensePlace: z.string().optional(),
  hasDriver2: z.boolean().optional(),
  driver2Name: z.string().optional(),
  driver2Dob: z.string().optional(),
  driver2BirthPlace: z.string().optional(),
  driver2Address: z.string().optional(),
  driver2Phone: z.string().optional(),
  driver2Cin: z.string().optional(),
  driver2CinDate: z.string().optional(),
  driver2CinPlace: z.string().optional(),
  driver2License: z.string().optional(),
  driver2LicenseDate: z.string().optional(),
  driver2LicensePlace: z.string().optional(),
  totalPartiel: z.string().optional(),
  divers: z.string().optional(),
  totalHT: z.string().optional(),
  tva: z.string().optional(),
  totalFacture: z.string().optional(),
  plusMoinsDivers: z.string().optional(),
  depot: z.string().optional(),
  depotGarantie: z.string().optional(),
  prep: z.string().optional(),
  somme: z.string().optional(),
  resteAPayer: z.string().optional(),
  city: z.string().optional(),
  contractDate: z.string().optional(),
  companyId: z.string().optional(),
});

type ContractForm = z.infer<typeof contractSchema>;
const contractResolver = zodResolver(contractSchema) as any;

export default function ContractsPage() {
  const { t } = useLang();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debtWarning, setDebtWarning] = useState<{ amount: number; contracts: number } | null>(null);
  const [debtConfirmed, setDebtConfirmed] = useState(false);
  const [dateOverlap, setDateOverlap] = useState(false);
  const [contractPayments, setContractPayments] = useState<Record<string, { amount: number }[]>>({});
  const [clientSearch, setClientSearch] = useState("");
  const [showClientResults, setShowClientResults] = useState(false);
  const [tab, setTab] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContractForm>({
    resolver: contractResolver,
  });

  const watchCarId = watch("carId");
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");

  const clientSearchRef = useRef<HTMLDivElement>(null);

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (cl) =>
          cl.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          cl.cin.toLowerCase().includes(clientSearch.toLowerCase())
      ),
    [clients, clientSearch]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setShowClientResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (watchCarId && watchStartDate && watchEndDate) {
      const car = cars.find((c) => c.id === watchCarId);
      if (car) {
        const days = calculateRentalDays(watchStartDate, watchEndDate);
        const total = days * car.pricePerDay;
        setValue("pricePerDay", car.pricePerDay);
        setValue("totalAmount", total);
        setValue("depositAmount", car.depositAmount || 0);
        setValue("carName", `${car.brand} ${car.model}`);
      }
      const overlapping = contracts.some(
        (c) =>
          c.carId === watchCarId &&
          c.status === "active" &&
          c.startDate < watchEndDate &&
          c.endDate > watchStartDate
      );
      setDateOverlap(overlapping);
    } else {
      setDateOverlap(false);
    }
  }, [watchCarId, watchStartDate, watchEndDate, cars, contracts, setValue]);

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, collections.contracts), orderBy("createdAt", "desc")),
      (snapshot) => {
        setContracts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Contract)));
        setLoading(false);
      }
    );
    const unsub2 = onSnapshot(collection(db, collections.clients), (snapshot) => {
      setClients(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Client)));
    });
    const unsub3 = onSnapshot(
      query(collection(db, collections.cars), orderBy("brand", "asc")),
      (snapshot) => {
        setCars(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CarType)));
      }
    );
    const unsub4 = onSnapshot(collection(db, collections.payments), (snapshot) => {
      const grouped: Record<string, { amount: number }[]> = {};
      snapshot.docs.forEach((d) => {
        const p = d.data();
        if (p.contractId) {
          if (!grouped[p.contractId]) grouped[p.contractId] = [];
          grouped[p.contractId].push({ amount: p.amount || 0 });
        }
      });
      setContractPayments(grouped);
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const filtered = contracts.filter((c) => {
    const matchSearch =
      c.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      c.carName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const checkClientDebt = (clientId: string) => {
    setDebtConfirmed(false);
    const unpaid = contracts.filter((c) => c.clientId === clientId && c.status !== "cancelled");
    let totalDebt = 0;
    let count = 0;
    for (const c of unpaid) {
      const payments = contractPayments[c.id] || [];
      const paid = payments.reduce((s, p) => s + p.amount, 0);
      if (paid < c.totalAmount) {
        totalDebt += c.totalAmount - paid;
        count++;
      }
    }
    if (count > 0) setDebtWarning({ amount: totalDebt, contracts: count });
    else setDebtWarning(null);
  };

  const onSubmit = async (data: ContractForm) => {
    if (debtWarning && !debtConfirmed) return;
    try {
      const newId = await addToCollection(collections.contracts, {
        ...data,
        rentalDays: calculateRentalDays(data.startDate, data.endDate),
        depositReturned: false,
        status: "active",
        returnDate: "",
      });
      await updateDocument(collections.cars, data.carId, { status: "rented" });
      await logAction("create_contract", "admin", newId, `#${newId.slice(-6)} - ${data.clientName}`, `السيارة: ${data.carName}، المبلغ: ${data.totalAmount} د.ت`);
      const client = clients.find((cl) => cl.id === data.clientId);
      if (client) {
        await addPoints(data.clientId, data.clientName, client.cin, client.phone, data.totalAmount);
      }
      toast.success(t("contract_created"));
      setModalOpen(false);
      reset();
      setDebtWarning(null);
      setDateOverlap(false);
      setClientSearch("");
    } catch {
      toast.error(t("contract_create_error"));
    }
  };

  const completeContract = async (contract: Contract) => {
    try {
      await updateDocument(collections.contracts, contract.id, {
        status: "completed",
        returnDate: new Date().toISOString(),
      });
      await updateDocument(collections.cars, contract.carId, { status: "available" });
      await logAction("complete_contract", "admin", contract.id, `#${contract.id.slice(-6)} - ${contract.clientName}`, "");
      toast.success(t("contract_completed"));
    } catch {
      toast.error(t("error"));
    }
  };

  const columns = [
    {
      key: "client",
      header: t("client"),
      render: (c: Contract) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">{c.clientName}</span>
        </div>
      ),
    },
    {
      key: "car",
      header: t("vehicle"),
      render: (c: Contract) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Car size={14} className="text-gray-400" />
          <span>{c.carName}</span>
        </div>
      ),
    },
    {
      key: "dates",
      header: t("period"),
      render: (c: Contract) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Calendar size={12} className="text-gray-400" />
            {formatDateShort(c.startDate)} - {formatDateShort(c.endDate)}
          </div>
          <span className="text-xs text-gray-400">{c.rentalDays} {t("days")}</span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: t("amount"),
      render: (c: Contract) => (
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(c.totalAmount)}</span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (c: Contract) => <Badge status={c.status} />,
    },
    {
      key: "actions",
      header: t("actions"),
      render: (c: Contract) =>
        c.status === "active" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); completeContract(c); }}
          >
            {t("complete")}
          </Button>
        ) : null,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("contracts_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("contracts_desc")}</p>
        </div>
        <Button onClick={() => { reset(); setModalOpen(true); }}>
          <Plus size={18} />
          {t("new_contract")}
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <Select
            options={[
              { value: "", label: t("all") },
              { value: "active", label: t("active") },
              { value: "completed", label: t("completed") },
              { value: "cancelled", label: t("cancelled") },
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
        <Table columns={columns} data={filtered} emptyMessage={t("no_contracts_found")} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t("new_contract")} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={clientSearchRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("client")}
              </label>
              <div className="relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder={t("search") + "..."}
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientResults(true); }}
                  onFocus={() => setShowClientResults(true)}
                />
              </div>
              {showClientResults && clientSearch && filteredClients.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl max-h-48 overflow-y-auto">
                  {filteredClients.map((cl) => (
                    <button key={cl.id} type="button" className="w-full text-right px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                      onClick={() => {
                        setValue("clientId", cl.id);
                        setValue("clientName", cl.name);
                        setClientSearch(`${cl.name} - ${cl.phone}`);
                        setShowClientResults(false);
                        checkClientDebt(cl.id);
                      }}
                    >
                      <span className="font-medium">{cl.name}</span>
                      <span className="mr-2 text-xs text-gray-400">{cl.cin}</span>
                      <span className="mr-2 text-xs text-gray-400">{cl.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {showClientResults && clientSearch && filteredClients.length === 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl p-3 text-sm text-gray-400 text-center">{t("no_clients")}</div>
              )}
              {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId.message as string}</p>}
            </div>
            <Select
              label={t("vehicle")}
              options={cars.filter((ca) => ca.status === "available").map((ca) => ({ value: ca.id, label: `${ca.brand} ${ca.model} - ${ca.plateNumber}` }))}
              onChange={(e) => setValue("carId", e.target.value)}
              placeholder={t("select_car")}
            />
          </div>

          <div className="flex gap-1 border-b border-white/10 mb-4 overflow-x-auto">
            {[
              { icon: <Car size={16} />, label: t("vehicle_tab") },
              { icon: <User size={16} />, label: t("driver_tab") },
              { icon: <IdCard size={16} />, label: t("driver2_tab") },
              { icon: <CreditCard size={16} />, label: t("financial_tab") },
              { icon: <MapPin size={16} />, label: t("other_tab") },
            ].map((tb, i) => (
              <button key={i} type="button" onClick={() => setTab(i)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  tab === i ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tb.icon}{tb.label}
              </button>
            ))}
          </div>

          {tab === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t("contract_number")} id="contractNumber" {...register("contractNumber")} />
              <Input label={t("registration")} id="registration" {...register("registration")} />
              <Input label={t("brand")} id="brand" {...register("brand")} />
              <Input label={t("model")} id="model" {...register("model")} />
              <Input label={t("category")} id="category" {...register("category")} />
              <Select label={t("fuel_type")} options={[{ value: "Essence", label: "Essence" }, { value: "Gasoil", label: "Gasoil" }]} onChange={(e) => setValue("fuelType", e.target.value)} />
              <Input label={t("departure_date")} id="departureDate" type="date" {...register("departureDate")} />
              <Input label={t("departure_time")} id="departureTime" type="time" {...register("departureTime")} />
              <Input label={t("departure_place")} id="departurePlace" {...register("departurePlace")} />
              <Input label={t("return_date")} id="endDate" type="date" {...register("endDate")} />
              <Input label={t("return_time")} id="returnTimeInput" type="time" {...register("departureTime")} />
              <Input label={t("departure_km")} id="departureKm" {...register("departureKm")} />
              <Input label={t("return_km")} id="returnKm" {...register("returnKm")} />
              <Input label={t("remise_retour")} id="remiseRetour" {...register("remiseRetour")} />
              <Input label={t("price_per_day")} id="pricePerDay" type="number" {...register("pricePerDay")} readOnly />
              <Input label={t("total_amount")} id="totalAmount" type="number" {...register("totalAmount")} readOnly />
              <Input label={t("deposit")} id="depositAmount" type="number" {...register("depositAmount")} readOnly />
            </div>
          )}

          {tab === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t("driver_name")} id="driverName" {...register("driverName")} />
              <Input label={t("driver_phone")} id="driverPhone" {...register("driverPhone")} />
              <Input label={t("driver_cin")} id="driverCin" {...register("driverCin")} />
              <Input label={t("driver_cin_date")} id="driverCinDate" type="date" {...register("driverCinDate")} />
              <Input label={t("driver_cin_place")} id="driverCinPlace" {...register("driverCinPlace")} />
              <Input label={t("driver_dob")} id="driverDob" type="date" {...register("driverDob")} />
              <Input label={t("driver_birth_place")} id="driverBirthPlace" {...register("driverBirthPlace")} />
              <Input label={t("driver_address")} id="driverAddress" {...register("driverAddress")} />
              <Input label={t("driver_license")} id="driverLicense" {...register("driverLicense")} />
              <Input label={t("driver_license_date")} id="driverLicenseDate" type="date" {...register("driverLicenseDate")} />
              <Input label={t("driver_license_place")} id="driverLicensePlace" {...register("driverLicensePlace")} />
            </div>
          )}

          {tab === 2 && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" onChange={(e) => setValue("hasDriver2", e.target.checked)} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("has_driver2")}</span>
              </label>
              {watch("hasDriver2") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t("driver2_name")} id="driver2Name" {...register("driver2Name")} />
                  <Input label={t("driver2_phone")} id="driver2Phone" {...register("driver2Phone")} />
                  <Input label={t("driver2_cin")} id="driver2Cin" {...register("driver2Cin")} />
                  <Input label={t("driver2_cin_date")} id="driver2CinDate" type="date" {...register("driver2CinDate")} />
                  <Input label={t("driver2_cin_place")} id="driver2CinPlace" {...register("driver2CinPlace")} />
                  <Input label={t("driver2_dob")} id="driver2Dob" type="date" {...register("driver2Dob")} />
                  <Input label={t("driver2_birth_place")} id="driver2BirthPlace" {...register("driver2BirthPlace")} />
                  <Input label={t("driver2_address")} id="driver2Address" {...register("driver2Address")} />
                  <Input label={t("driver2_license")} id="driver2License" {...register("driver2License")} />
                  <Input label={t("driver2_license_date")} id="driver2LicenseDate" type="date" {...register("driver2LicenseDate")} />
                  <Input label={t("driver2_license_place")} id="driver2LicensePlace" {...register("driver2LicensePlace")} />
                </div>
              )}
            </div>
          )}

          {tab === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t("total_facture")} id="totalFacture" {...register("totalFacture")} />
              <Input label={t("divers")} id="divers" {...register("divers")} />
              <Input label={t("prep")} id="prep" {...register("prep")} />
              <Input label={t("depot")} id="depot" {...register("depot")} />
              <Input label={t("depot_garantie")} id="depotGarantie" {...register("depotGarantie")} />
              <Input label={t("total_partiel")} id="totalPartiel" {...register("totalPartiel")} readOnly />
              <Input label={t("total_ht")} id="totalHT" {...register("totalHT")} readOnly />
              <Input label={t("tva")} id="tva" {...register("tva")} readOnly />
              <Input label={t("somme")} id="somme" {...register("somme")} readOnly />
              <Input label={t("reste_a_payer")} id="resteAPayer" {...register("resteAPayer")} readOnly />
            </div>
          )}

          {tab === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t("city")} id="city" {...register("city")} />
              <Input label={t("contract_date")} id="contractDate" type="date" {...register("contractDate")} />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("notes")}</label>
                <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" rows={3} {...register("notes")} />
              </div>
            </div>
          )}

          {debtWarning && !debtConfirmed && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{t("client_has_debt")}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{t("debt_amount")}: {debtWarning.amount.toLocaleString()} {t("currency_symbol")} ({debtWarning.contracts} {t("contracts")})</p>
              <button type="button" onClick={() => setDebtConfirmed(true)} className="mt-2 text-xs px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">{t("continue_despite_debt")}</button>
            </div>
          )}
          {dateOverlap && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{t("date_overlap_warning")}</p>
            </div>
          )}
          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setClientSearch(""); setTab(0); }}>{t("cancel")}</Button>
            <Button type="submit" disabled={isSubmitting || (!!debtWarning && !debtConfirmed) || dateOverlap}>{isSubmitting ? t("creating") : t("create_contract")}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
