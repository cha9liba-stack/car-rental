"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import {
  Settings2,
  Database,
  Share2,
  Shield,
  Building2,
  DollarSign,
  Save,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLang } from "@/components/layout/language-provider";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const { lang, setLang, t } = useLang();

  const settingsSchema = z.object({
    companyName: z.string().min(1, t("company_name_required")),
    companyPhone: z.string().optional(),
    companyEmail: z.string().optional(),
    companyAddress: z.string().optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    currency: z.string().optional(),
    lateFeePerDay: z.coerce.number().min(0).optional(),
  });

  type SettingsForm = z.infer<typeof settingsSchema>;
  const settingsResolver = zodResolver(settingsSchema) as any;

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<SettingsForm>({
    resolver: settingsResolver,
  });

  useEffect(() => {
    getDoc(doc(db, "settings", "general")).then((snap) => {
      if (snap.exists()) {
        reset(snap.data() as SettingsForm);
      }
      setLoading(false);
    });
  }, [reset]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await setDoc(doc(db, "settings", "general"), data, { merge: true });
      toast.success(t("settings_saved"));
    } catch {
      toast.error(t("settings_save_error"));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("settings_title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("settings_desc")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <Building2 size={20} />
              </div>
              <CardTitle>{t("company_info")}</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label={t("company_name")} id="companyName" {...register("companyName")} placeholder={t("company_name_placeholder")} />
            <Input label={t("company_phone")} id="companyPhone" {...register("companyPhone")} placeholder="+216 XX XXX XXX" />
            <Input label={t("company_email")} id="companyEmail" {...register("companyEmail")} placeholder="info@example.com" />
            <Input label={t("company_address")} id="companyAddress" {...register("companyAddress")} placeholder="..." />
            <Input label={t("tax_rate")} id="taxRate" type="number" {...register("taxRate")} />
            <Input label={t("currency")} id="currency" {...register("currency")} placeholder={t("currency_symbol")} />
            <Input label={t("late_fee")} id="lateFeePerDay" type="number" {...register("lateFeePerDay")} />
            <Button type="submit" disabled={isSubmitting || loading} className="w-full">
              <Save size={16} />
              {isSubmitting ? t("saving") : t("save_settings")}
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Database size={20} />
                </div>
                <CardTitle>{t("database")}</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t("connected")}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t("firebase_project")}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || t("not_specified")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t("version")}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">2.0.0</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t("mode")}</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t("production")}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <Globe size={20} />
                </div>
                <CardTitle>{t("language")}</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              <button
                onClick={() => setLang("ar")}
                className={`w-full text-right px-4 py-3 rounded-xl border transition-all ${
                  lang === "ar"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="font-medium">🇸🇦 {t("arabic")}</span>
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`w-full text-right px-4 py-3 rounded-xl border transition-all ${
                  lang === "fr"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <span className="font-medium">🇫🇷 {t("french")}</span>
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <Share2 size={20} />
                </div>
                <CardTitle>{t("deployment")}</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-400">
                <p>{t("deploy_to_vercel")}</p>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>{t("deploy_step_1")}</li>
                  <li>{t("deploy_step_2")}</li>
                  <li>{t("deploy_step_3")}</li>
                  <li>{t("deploy_step_4")}</li>
                </ol>
              </div>
              <Button variant="outline" className="w-full" onClick={() => {
                navigator.clipboard.writeText(
                  `NEXT_PUBLIC_FIREBASE_API_KEY=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""}\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""}\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""}\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""}\nNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""}\nNEXT_PUBLIC_FIREBASE_APP_ID=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""}`
                );
                toast.success(t("env_copied"));
              }}>
                <Share2 size={16} />
                {t("copy_env_vars")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
