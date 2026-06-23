"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/layout/language-provider";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Phone,
  Mail,
  IdCard,
  Trash2,
  Edit2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Client } from "@/lib/types";
import { formatDate } from "@/lib/utils";
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

const clientSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  phone: z.string().min(8, "Le téléphone est requis"),
  email: z.string().email("Email invalide").or(z.literal("")),
  address: z.string().optional(),
  cin: z.string().min(4, "Le CIN est requis"),
  cinExpiryDate: z.string().optional(),
  driverLicense: z.string().optional(),
  notes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const { t } = useLang();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    const q = query(
      collection(db, collections.clients),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Client)
      );
      setClients(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.cin && c.cin.includes(search))
  );

  const onSubmit = async (data: ClientForm) => {
    try {
      if (editing) {
        await updateDocument(collections.clients, editing.id, data);
        await logAction("update_client", "admin", editing.id, editing.name, "");
        toast.success(t("client_updated"));
      } else {
        const newId = await addToCollection(collections.clients, data);
        await logAction("create_client", "admin", newId, data.name, "");
        toast.success(t("client_added"));
      }
      setModalOpen(false);
      setEditing(null);
      reset();
    } catch {
      toast.error(t("save_error"));
    }
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    reset(client);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    reset({
      name: "",
      phone: "",
      email: "",
      address: "",
      cin: "",
      cinExpiryDate: "",
      driverLicense: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("confirm_delete_client"))) {
      try {
        const deletedClient = clients.find((c) => c.id === id);
        await deleteDocument(collections.clients, id);
        await logAction("delete_client", "admin", id, deletedClient?.name || "", "");
        toast.success(t("client_deleted"));
      } catch {
        toast.error(t("delete_error"));
      }
    }
  };

  const columns = [
    {
      key: "name",
      header: t("name"),
      render: (c: Client) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
            <p className="text-xs text-gray-400">{c.cin}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: t("phone"),
      render: (c: Client) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Phone size={14} className="text-gray-400" />
          {c.phone}
        </div>
      ),
    },
    {
      key: "email",
      header: t("email"),
      render: (c: Client) =>
        c.email ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail size={14} className="text-gray-400" />
            {c.email}
          </div>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">-</span>
        ),
    },
    {
      key: "cin",
      header: t("cin"),
      render: (c: Client) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <IdCard size={14} className="text-gray-400" />
          {c.cin}
        </div>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      render: (c: Client) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(c); }}
            className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Edit2 size={16} />
          </button>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("clients_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("clients_desc")}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} />
          {t("add_client")}
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
            placeholder={t("search_client")}
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
          emptyMessage={t("no_clients")}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? t("edit_client") : t("add_client")}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("full_name")} id="name" error={errors.name?.message} {...register("name")} />
            <Input label={t("phone")} id="phone" error={errors.phone?.message} {...register("phone")} />
            <Input label={t("email")} id="email" error={errors.email?.message} {...register("email")} />
            <Input label={t("address")} id="address" {...register("address")} />
            <Input label={t("cin")} id="cin" error={errors.cin?.message} {...register("cin")} />
            <Input label={t("cin_expiry")} id="cinExpiryDate" type="date" {...register("cinExpiryDate")} />
            <Input label={t("driver_license")} id="driverLicense" {...register("driverLicense")} />
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
