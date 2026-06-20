"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import {
  Settings2,
  Database,
  Share2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configuration du système</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <Database size={20} />
              </div>
              <CardTitle>Base de données</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connecté à Firebase avec succès
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-sm text-gray-500 dark:text-gray-400">Projet Firebase</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Non défini"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-sm text-gray-500 dark:text-gray-400">Version</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">2.0.0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Mode</span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Production</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Share2 size={20} />
              </div>
              <CardTitle>Déploiement</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-400">
              <p>Pour déployer l&apos;application sur Vercel :</p>
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Poussez le projet sur GitHub</li>
                <li>Connectez Vercel à votre dépôt GitHub</li>
                <li>Ajoutez les variables d&apos;environnement Firebase</li>
                <li>Déployez !</li>
              </ol>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(
                  `NEXT_PUBLIC_FIREBASE_API_KEY=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""}\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""}\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""}\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""}\nNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""}\nNEXT_PUBLIC_FIREBASE_APP_ID=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""}`
                );
                toast.success("Variables d'environnement copiées");
              }}
            >
              <Share2 size={16} />
              Copier les variables d&apos;environnement
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
