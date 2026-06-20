"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Car, Edit2, Trash2, Calendar, Fuel, Gauge, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Car as CarType } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getDocument, deleteDocument, collections } from "@/lib/firestore";
import { toast } from "sonner";
import Link from "next/link";

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<CarType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocument<CarType>(collections.cars, id).then((data) => {
      setCar(data);
      setLoading(false);
    });
  }, [id]);

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
        <Car size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-400 dark:text-gray-500">Véhicule introuvable</p>
        <Link href="/cars" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mt-2 inline-block font-medium">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      await deleteDocument(collections.cars, id);
      toast.success("Véhicule supprimé");
      router.push("/cars");
    }
  };

  const fuelLabels: Record<string, string> = {
    essence: "Essence", diesel: "Diesel", electrique: "Électrique", hybride: "Hybride",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cars" className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {car.brand} {car.model}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{car.plateNumber}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge status={car.status} />
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 size={16} />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <InfoItem label="Marque" value={car.brand} icon={<Car size={16} />} />
              <InfoItem label="Modèle" value={car.model} icon={<Car size={16} />} />
              <InfoItem label="Année" value={String(car.year)} icon={<Calendar size={16} />} />
              <InfoItem label="Couleur" value={car.color || "-"} />
              <InfoItem label="Plaque" value={car.plateNumber} />
              <InfoItem label="Châssis" value={car.chassisNumber || "-"} />
              <InfoItem label="Carburant" value={fuelLabels[car.fuelType] || car.fuelType} icon={<Fuel size={16} />} />
              <InfoItem label="Transmission" value={car.transmission === "manuelle" ? "Manuelle" : "Automatique"} icon={<Gauge size={16} />} />
              <InfoItem label="Places" value={String(car.seats)} />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Tarifs</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <PriceRow label="Par jour" value={formatCurrency(car.pricePerDay)} />
              <PriceRow label="Par semaine" value={car.pricePerWeek ? formatCurrency(car.pricePerWeek) : "-"} />
              <PriceRow label="Par mois" value={car.pricePerMonth ? formatCurrency(car.pricePerMonth) : "-"} />
              <div className="pt-3 border-t border-white/10">
                <PriceRow label="Caution" value={formatCurrency(car.depositAmount)} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <InfoItem label="Assurance expire le" value={car.insuranceExpiryDate ? formatDate(car.insuranceExpiryDate) : "-"} icon={<Shield size={16} />} />
              <InfoItem label="Visite technique" value={car.technicalInspectionDate ? formatDate(car.technicalInspectionDate) : "-"} icon={<Calendar size={16} />} />
            </div>
          </Card>
        </div>
      </div>

      {car.notes && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <p className="text-gray-600 dark:text-gray-400">{car.notes}</p>
        </Card>
      )}
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

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
