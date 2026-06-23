"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import {
  Database,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Users,
  Car,
  FileText,
  DollarSign,
} from "lucide-react";
import { addToCollection } from "@/lib/firestore";
import { Client, Car as CarType, Contract, Payment } from "@/lib/types";

const clientsData: Omit<Client, "id" | "createdAt" | "updatedAt">[] = [
  { name: "أحمد بن علي", phone: "+216 98 765 432", email: "ahmed.benali@gmail.com", address: "15 نهج قرطاج، تونس", cin: "12345678", cinExpiryDate: "2028-05-15", driverLicense: "TN-98765", notes: "عميل VIP" },
  { name: "فاطمة التربلسي", phone: "+216 52 123 456", email: "fatma.trabelsi@yahoo.fr", address: "8 شارع الحبيب بورقيبة، صفاقس", cin: "23456789", cinExpiryDate: "2027-11-20", driverLicense: "TN-87654", notes: "" },
  { name: "محمد صالح", phone: "+216 50 111 222", email: "mohamed.salah@gmail.com", address: "42 نهج علي بلحوان، سوسة", cin: "34567890", cinExpiryDate: "2029-03-10", driverLicense: "TN-76543", notes: "رخصة دولية" },
  { name: "سنية الماجري", phone: "+216 55 333 444", email: "sonia.mejri@hotmail.com", address: "3 شارع الجيش، بنزرت", cin: "45678901", cinExpiryDate: "2026-08-01", driverLicense: "TN-65432", notes: "" },
  { name: "كريم الجزيري", phone: "+216 58 777 888", email: "karim.jaziri@gmail.com", address: "27 نهج الياسمين، نابل", cin: "56789012", cinExpiryDate: "2028-12-05", driverLicense: "TN-54321", notes: "عميل منتظم" },
  { name: "نادية القروي", phone: "+216 24 999 000", email: "nadia.karray@topnet.tn", address: "19 نهج ابن رشد، تونس", cin: "67890123", cinExpiryDate: "2027-06-18", driverLicense: "TN-43210", notes: "" },
  { name: "هشام بن محمود", phone: "+216 26 555 666", email: "hichem.bm@gmail.com", address: "5 نهج الحرية، أريانة", cin: "78901234", cinExpiryDate: "2029-09-25", driverLicense: "TN-32109", notes: "سائق رئيسي" },
  { name: "ليلة بوعزيزي", phone: "+216 20 123 789", email: "leila.bouazizi@outlook.com", address: "12 شارع المنصف باي، المنستير", cin: "89012345", cinExpiryDate: "2026-04-30", driverLicense: "TN-21098", notes: "" },
];

const carsData: Omit<CarType, "id" | "createdAt" | "updatedAt">[] = [
  { brand: "رونو", model: "كليو 5", year: 2023, plateNumber: "123 TU 1111", chassisNumber: "VF1CB1N0145123456", color: "أزرق", fuelType: "essence", seats: 5, doors: 5, transmission: "manuelle", pricePerDay: 80, pricePerWeek: 420, pricePerMonth: 1500, depositAmount: 400, status: "available", images: [], insuranceExpiryDate: "2026-12-31", technicalInspectionDate: "2026-06-15", notes: "" },
  { brand: "بيجو", model: "208", year: 2024, plateNumber: "234 TU 2222", chassisNumber: "VF3LB1N0145234567", color: "أبيض", fuelType: "diesel", seats: 5, doors: 5, transmission: "manuelle", pricePerDay: 90, pricePerWeek: 480, pricePerMonth: 1700, depositAmount: 500, status: "available", images: [], insuranceExpiryDate: "2027-03-20", technicalInspectionDate: "2026-09-10", notes: "GPS مدمج" },
  { brand: "سيات", model: "إبيزا", year: 2023, plateNumber: "345 TU 3333", chassisNumber: "VSSZZZ6KZPR123456", color: "أسود", fuelType: "essence", seats: 5, doors: 3, transmission: "manuelle", pricePerDay: 75, pricePerWeek: 400, pricePerMonth: 1400, depositAmount: 400, status: "rented", images: [], insuranceExpiryDate: "2026-08-12", technicalInspectionDate: "2026-03-05", notes: "" },
  { brand: "فولكسفاجن", model: "غولف 8", year: 2024, plateNumber: "456 TU 4444", chassisNumber: "WVWZZZ1KZPW123456", color: "رمادي", fuelType: "diesel", seats: 5, doors: 5, transmission: "automatique", pricePerDay: 120, pricePerWeek: 650, pricePerMonth: 2400, depositAmount: 700, status: "available", images: [], insuranceExpiryDate: "2027-01-15", technicalInspectionDate: "2026-07-20", notes: "ناقل حركة أوتوماتيكي" },
  { brand: "هيونداي", model: "i20", year: 2023, plateNumber: "567 TU 5555", chassisNumber: "MALBB51CBPM123456", color: "أحمر", fuelType: "essence", seats: 5, doors: 5, transmission: "manuelle", pricePerDay: 70, pricePerWeek: 380, pricePerMonth: 1300, depositAmount: 300, status: "maintenance", images: [], insuranceExpiryDate: "2026-10-05", technicalInspectionDate: "2026-04-18", notes: "تغيير زيت" },
  { brand: "كيا", model: "بيكانتو", year: 2024, plateNumber: "678 TU 6666", chassisNumber: "KNABXXXZCPT123456", color: "أخضر", fuelType: "essence", seats: 5, doors: 5, transmission: "manuelle", pricePerDay: 65, pricePerWeek: 350, pricePerMonth: 1200, depositAmount: 300, status: "available", images: [], insuranceExpiryDate: "2027-05-30", technicalInspectionDate: "2026-11-12", notes: "" },
  { brand: "تويوتا", model: "ياريس", year: 2024, plateNumber: "789 TU 7777", chassisNumber: "JTDBT1KX4R1234567", color: "أبيض", fuelType: "hybride", seats: 5, doors: 5, transmission: "automatique", pricePerDay: 110, pricePerWeek: 600, pricePerMonth: 2200, depositAmount: 600, status: "available", images: [], insuranceExpiryDate: "2027-04-10", technicalInspectionDate: "2026-10-01", notes: "هجين - اقتصاديّ" },
  { brand: "داسيا", model: "سانديرو", year: 2023, plateNumber: "890 TU 8888", chassisNumber: "UUA7T1AK7PL123456", color: "برتقالي", fuelType: "diesel", seats: 5, doors: 5, transmission: "manuelle", pricePerDay: 60, pricePerWeek: 320, pricePerMonth: 1100, depositAmount: 250, status: "rented", images: [], insuranceExpiryDate: "2026-07-25", technicalInspectionDate: "2026-02-28", notes: "" },
];

function generateContracts(carIds: string[], clientIds: string[]): Omit<Contract, "id" | "createdAt" | "updatedAt">[] {
  return [
    { clientId: clientIds[0], clientName: "أحمد بن علي", carId: carIds[2], carName: "سيات إبيزا", startDate: "2026-06-01", endDate: "2026-06-08", returnDate: "2026-06-08", rentalDays: 7, pricePerDay: 75, totalAmount: 525, depositAmount: 400, depositReturned: false, status: "active", notes: "" },
    { clientId: clientIds[1], clientName: "فاطمة التربلسي", carId: carIds[7], carName: "داسيا سانديرو", startDate: "2026-05-25", endDate: "2026-06-02", returnDate: "2026-05-30", rentalDays: 8, pricePerDay: 60, totalAmount: 480, depositAmount: 250, depositReturned: true, status: "completed", notes: "إرجاع مبكر" },
    { clientId: clientIds[3], clientName: "سنية الماجري", carId: carIds[0], carName: "رونو كليو 5", startDate: "2026-06-10", endDate: "2026-06-15", returnDate: "2026-06-15", rentalDays: 5, pricePerDay: 80, totalAmount: 400, depositAmount: 400, depositReturned: false, status: "active", notes: "" },
    { clientId: clientIds[4], clientName: "كريم الجزيري", carId: carIds[3], carName: "فولكسفاجن غولف 8", startDate: "2026-06-12", endDate: "2026-06-20", returnDate: "", rentalDays: 8, pricePerDay: 120, totalAmount: 960, depositAmount: 700, depositReturned: false, status: "active", notes: "عميل VIP" },
    { clientId: clientIds[5], clientName: "نادية القروي", carId: carIds[5], carName: "كيا بيكانتو", startDate: "2026-05-15", endDate: "2026-05-22", returnDate: "2026-05-22", rentalDays: 7, pricePerDay: 65, totalAmount: 455, depositAmount: 300, depositReturned: true, status: "completed", notes: "" },
    { clientId: clientIds[6], clientName: "هشام بن محمود", carId: carIds[6], carName: "تويوتا ياريس", startDate: "2026-06-05", endDate: "2026-06-12", returnDate: "", rentalDays: 7, pricePerDay: 110, totalAmount: 770, depositAmount: 600, depositReturned: false, status: "active", notes: "هجين" },
    { clientId: clientIds[0], clientName: "أحمد بن علي", carId: carIds[1], carName: "بيجو 208", startDate: "2026-04-10", endDate: "2026-04-17", returnDate: "2026-04-17", rentalDays: 7, pricePerDay: 90, totalAmount: 630, depositAmount: 500, depositReturned: true, status: "completed", notes: "" },
    { clientId: clientIds[7], clientName: "ليلة بوعزيزي", carId: carIds[3], carName: "فولكسفاجن غولف 8", startDate: "2026-06-15", endDate: "2026-06-22", returnDate: "", rentalDays: 7, pricePerDay: 120, totalAmount: 840, depositAmount: 700, depositReturned: false, status: "active", notes: "" },
  ];
}

function generatePayments(contracts: Omit<Contract, "id" | "createdAt" | "updatedAt">[]): Omit<Payment, "id" | "createdAt">[] {
  return [
    { contractId: "tbd", clientName: "أحمد بن علي", amount: 525, paymentMethod: "cash", paymentDate: "2026-06-01", type: "payment", notes: "دفعة كاملة" },
    { contractId: "tbd", clientName: "فاطمة التربلسي", amount: 480, paymentMethod: "card", paymentDate: "2026-05-25", type: "payment", notes: "دفع بالبطاقة" },
    { contractId: "tbd", clientName: "فاطمة التربلسي", amount: 250, paymentMethod: "cash", paymentDate: "2026-05-30", type: "return", notes: "إرجاع التأمين" },
    { contractId: "tbd", clientName: "سنية الماجري", amount: 400, paymentMethod: "cash", paymentDate: "2026-06-10", type: "payment", notes: "" },
    { contractId: "tbd", clientName: "كريم الجزيري", amount: 960, paymentMethod: "transfer", paymentDate: "2026-06-12", type: "payment", notes: "تحويل بنكي" },
    { contractId: "tbd", clientName: "نادية القروي", amount: 455, paymentMethod: "cash", paymentDate: "2026-05-15", type: "payment", notes: "" },
    { contractId: "tbd", clientName: "نادية القروي", amount: 300, paymentMethod: "cash", paymentDate: "2026-05-22", type: "return", notes: "إرجاع التأمين" },
    { contractId: "tbd", clientName: "هشام بن محمود", amount: 770, paymentMethod: "card", paymentDate: "2026-06-05", type: "payment", notes: "" },
    { contractId: "tbd", clientName: "أحمد بن علي", amount: 630, paymentMethod: "cash", paymentDate: "2026-04-10", type: "payment", notes: "" },
    { contractId: "tbd", clientName: "أحمد بن علي", amount: 500, paymentMethod: "cash", paymentDate: "2026-04-17", type: "return", notes: "إرجاع التأمين" },
    { contractId: "tbd", clientName: "ليلة بوعزيزي", amount: 840, paymentMethod: "card", paymentDate: "2026-06-15", type: "payment", notes: "" },
  ];
}

const stepLabels = ["العملاء", "السيارات", "العقود", "المدفوعات"];

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSeed() {
    setSeeding(true);
    setStep(0);
    setResult(null);

    try {
      setResult({ success: false, message: "جاري إضافة العملاء..." });
      const clientIds: string[] = [];
      for (const client of clientsData) {
        const id = await addToCollection("clients", client);
        clientIds.push(id);
      }
      setStep(1);

      setResult({ success: false, message: "جاري إضافة السيارات..." });
      const carIds: string[] = [];
      for (const car of carsData) {
        const id = await addToCollection("cars", car);
        carIds.push(id);
      }
      setStep(2);

      setResult({ success: false, message: "جاري إضافة العقود..." });
      const contractsData = generateContracts(carIds, clientIds);
      const contractIds: string[] = [];
      for (const contract of contractsData) {
        const id = await addToCollection("contracts", contract);
        contractIds.push(id);
      }
      setStep(3);

      setResult({ success: false, message: "جاري إضافة المدفوعات..." });
      const paymentsData = generatePayments(contractsData);
      let paymentIndex = 0;
      for (const payment of paymentsData) {
        const contractId = contractIds[Math.floor(paymentIndex / 2) % contractIds.length];
        await addToCollection("payments", { ...payment, contractId });
        paymentIndex++;
      }

      setSeeding(false);
      setResult({
        success: true,
        message: `✓ تمت إضافة بيانات الاختبار بنجاح!\n${clientIds.length} عميل، ${carIds.length} سيارة، ${contractsData.length} عقد، ${paymentsData.length} دفعة.`,
      });
    } catch (err) {
      setSeeding(false);
      setResult({
        success: false,
        message: `خطأ: ${err instanceof Error ? err.message : "حدث خطأ غير متوقع"}`,
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تهيئة البيانات
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            إضافة بيانات اختبار إلى قاعدة البيانات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <Database size={20} />
                </div>
                <CardTitle>بيانات الاختبار</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>
                  هذه الصفحة ستضيف بيانات اختبار إلى قاعدة Firestore الخاصة بك.
                  استخدمها فقط لتهيئة التطبيق ببيانات نموذجية.
                </span>
              </div>

              {result && (
                <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                  result.success
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 text-blue-700 dark:text-blue-300"
                }`}>
                  {result.success ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <Loader2 size={18} className="shrink-0 mt-0.5 animate-spin" />}
                  <pre className="whitespace-pre-wrap font-sans">{result.message}</pre>
                </div>
              )}

              <div className="space-y-3">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > i
                        ? "bg-emerald-500 text-white"
                        : step === i
                        ? "bg-indigo-500 text-white animate-pulse"
                        : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500"
                    }`}>
                      {step > i ? <CheckCircle2 size={16} /> : i + 1}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {i === 0 && <Users size={16} className="text-gray-400" />}
                      {i === 1 && <Car size={16} className="text-gray-400" />}
                      {i === 2 && <FileText size={16} className="text-gray-400" />}
                      {i === 3 && <DollarSign size={16} className="text-gray-400" />}
                      <span className={step >= i ? "text-gray-900 dark:text-white font-medium" : "text-gray-400 dark:text-gray-500"}>
                        {label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {i === 0 && `(${clientsData.length})`}
                        {i === 1 && `(${carsData.length})`}
                        {i === 2 && `(8)`}
                        {i === 3 && `(11)`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSeed}
                disabled={seeding}
                size="lg"
                className="w-full"
              >
                {seeding ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    جاري التهيئة...
                  </>
                ) : (
                  <>
                    <Database size={18} />
                    تهيئة بيانات الاختبار
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>نظرة عامة على البيانات</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Users size={14} /> العملاء
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{clientsData.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Car size={14} /> السيارات
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{carsData.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FileText size={14} /> العقود
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">8</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <DollarSign size={14} /> المدفوعات
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">11</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
