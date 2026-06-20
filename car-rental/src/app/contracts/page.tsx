"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  DollarSign,
  User,
  Car,
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

const contractSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  clientName: z.string(),
  carId: z.string().min(1, "Sélectionnez un véhicule"),
  carName: z.string(),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  pricePerDay: z.coerce.number().min(0),
  totalAmount: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

type ContractForm = z.infer<typeof contractSchema>;
const contractResolver = zodResolver(contractSchema) as any;

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    }
  }, [watchCarId, watchStartDate, watchEndDate, cars, setValue]);

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
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const filtered = contracts.filter((c) => {
    const matchSearch =
      c.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      c.carName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const onSubmit = async (data: ContractForm) => {
    try {
      await addToCollection(collections.contracts, {
        ...data,
        rentalDays: calculateRentalDays(data.startDate, data.endDate),
        depositReturned: false,
        status: "active",
        returnDate: "",
      });
      await updateDocument(collections.cars, data.carId, { status: "rented" });
      toast.success("Contrat créé avec succès");
      setModalOpen(false);
      reset();
    } catch {
      toast.error("Erreur lors de la création du contrat");
    }
  };

  const completeContract = async (contract: Contract) => {
    try {
      await updateDocument(collections.contracts, contract.id, {
        status: "completed",
        returnDate: new Date().toISOString(),
      });
      await updateDocument(collections.cars, contract.carId, { status: "available" });
      toast.success("Contrat terminé");
    } catch {
      toast.error("Erreur");
    }
  };

  const columns = [
    {
      key: "client",
      header: "Client",
      render: (c: Contract) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">{c.clientName}</span>
        </div>
      ),
    },
    {
      key: "car",
      header: "Véhicule",
      render: (c: Contract) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Car size={14} className="text-gray-400" />
          <span>{c.carName}</span>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Période",
      render: (c: Contract) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Calendar size={12} className="text-gray-400" />
            {formatDateShort(c.startDate)} - {formatDateShort(c.endDate)}
          </div>
          <span className="text-xs text-gray-400">{c.rentalDays} jours</span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Montant",
      render: (c: Contract) => (
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(c.totalAmount)}</span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (c: Contract) => <Badge status={c.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (c: Contract) =>
        c.status === "active" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); completeContract(c); }}
          >
            Terminer
          </Button>
        ) : null,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contrats</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestion des contrats de location</p>
        </div>
        <Button onClick={() => { reset(); setModalOpen(true); }}>
          <Plus size={18} />
          Nouveau contrat
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <Select
            options={[
              { value: "", label: "Tous" },
              { value: "active", label: "Actif" },
              { value: "completed", label: "Terminé" },
              { value: "cancelled", label: "Annulé" },
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
        <Table columns={columns} data={filtered} emptyMessage="Aucun contrat trouvé" />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau contrat" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Client"
              options={clients.map((cl) => ({ value: cl.id, label: `${cl.name} - ${cl.phone}` }))}
              onChange={(e) => {
                const client = clients.find((cl) => cl.id === e.target.value);
                setValue("clientId", e.target.value);
                if (client) setValue("clientName", client.name);
              }}
              placeholder="Sélectionner un client"
            />
            <Select
              label="Véhicule"
              options={cars
                .filter((ca) => ca.status === "available")
                .map((ca) => ({
                  value: ca.id,
                  label: `${ca.brand} ${ca.model} - ${ca.plateNumber}`,
                }))}
              onChange={(e) => setValue("carId", e.target.value)}
              placeholder="Sélectionner un véhicule"
            />
            <Input label="Date de début" id="startDate" type="date" {...register("startDate")} />
            <Input label="Date de fin" id="endDate" type="date" {...register("endDate")} />
            <Input label="Prix journalier" id="pricePerDay" type="number" {...register("pricePerDay")} readOnly />
            <Input label="Total" id="totalAmount" type="number" {...register("totalAmount")} readOnly />
            <Input label="Caution" id="depositAmount" type="number" {...register("depositAmount")} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" rows={3} {...register("notes")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Création..." : "Créer le contrat"}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
