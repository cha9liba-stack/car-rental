"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLang } from "@/components/layout/language-provider";
import { Expense } from "@/lib/types";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Trash2 } from "lucide-react";

const CATEGORIES = ["fuel", "repair", "maintenance", "insurance", "tax", "fine", "other"] as const;

export default function ExpensesPage() {
  const { t, lang } = useLang();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cars, setCars] = useState<{ id: string; brand: string; model: string; plateNumber: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filterCat, setFilterCat] = useState("");
  const [filterCar, setFilterCar] = useState("");
  const [form, setForm] = useState({ carId: "", category: "fuel", amount: "", date: "", description: "", notes: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "expenses"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)));
      const carSnap = await getDocs(collection(db, "cars"));
      setCars(carSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let items = expenses;
    if (filterCat) items = items.filter((e) => e.category === filterCat);
    if (filterCar) items = items.filter((e) => e.carId === filterCar);
    return items;
  }, [expenses, filterCat, filterCar]);

  const openAdd = () => {
    setEditing(null);
    setForm({ carId: "", category: "fuel", amount: "", date: new Date().toISOString().split("T")[0], description: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ carId: e.carId, category: e.category, amount: String(e.amount), date: e.date, description: e.description, notes: e.notes });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.amount || !form.date) return;
    const car = cars.find((c) => c.id === form.carId);
    const data = {
      carId: form.carId,
      carName: car ? `${car.brand} ${car.model} (${car.plateNumber})` : "",
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      description: form.description,
      notes: form.notes,
    };
    if (editing) {
      await updateDoc(doc(db, "expenses", editing.id), { ...data, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, "expenses"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    setShowModal(false);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm(t("confirm_delete_expense"))) return;
    await deleteDoc(doc(db, "expenses", id));
    fetchData();
  };

  const columns = [
    {
      key: "date",
      header: t("date"),
      render: (e: Expense) => <span className="text-gray-700 dark:text-gray-300">{e.date}</span>,
    },
    {
      key: "carName",
      header: t("expense_car"),
      render: (e: Expense) => <span className="font-medium text-gray-900 dark:text-white">{e.carName}</span>,
    },
    {
      key: "category",
      header: t("expense_category"),
      render: (e: Expense) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
          {t(`${e.category}_cat`)}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("expense_amount"),
      render: (e: Expense) => (
        <span className="font-semibold text-gray-900 dark:text-white">{e.amount.toLocaleString()} {t("currency_symbol")}</span>
      ),
    },
    {
      key: "description",
      header: t("description"),
      render: (e: Expense) => <span className="text-gray-500 dark:text-gray-400 text-xs">{e.description}</span>,
    },
    {
      key: "actions",
      header: t("actions"),
      render: (e: Expense) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all">
            <Pencil size={15} />
          </button>
          <button onClick={() => remove(e.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("expenses_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("expenses_desc")}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} />
          {t("add_expense")}
        </Button>
      </div>

      <Card hover={false} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            options={CATEGORIES.map((c) => ({ value: c, label: t(`${c}_cat`) }))}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            placeholder={t("expense_category")}
          />
          <Select
            options={cars.map((c) => ({ value: c.id, label: `${c.brand} ${c.model} (${c.plateNumber})` }))}
            value={filterCar}
            onChange={(e) => setFilterCar(e.target.value)}
            placeholder={t("all")}
          />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 rounded-2xl shimmer" />)}
        </div>
      ) : (
        <Table columns={columns} data={filtered} emptyMessage={t("no_expenses")} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t("edit_expense") : t("add_expense")} size="md">
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
          <Select
            label={t("expense_car")}
            options={cars.map((c) => ({ value: c.id, label: `${c.brand} ${c.model} (${c.plateNumber})` }))}
            value={form.carId}
            onChange={(e) => setForm({ ...form, carId: e.target.value })}
            placeholder={t("expense_car")}
          />
          <Select
            label={t("expense_category")}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`${c}_cat`) }))}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("expense_amount")}</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("expense_date")}</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("description")}</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("notes")}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>{t("cancel")}</Button>
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
