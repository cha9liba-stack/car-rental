"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Car, Eye, EyeOff, UserPlus } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLang } from "@/components/layout/language-provider";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLang();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError(t("error_password_mismatch")); return; }
    if (password.length < 6) { setError(t("error_password_too_short")); return; }
    setLoading(true);
    try {
      if (!auth) throw new Error(t("error_firebase_auth_not_initialized"));
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      const messages: Record<string, string> = {
        "auth/email-already-in-use": t("error_email_in_use"),
        "auth/invalid-email": t("error_invalid_email"),
        "auth/weak-password": t("error_weak_password"),
        "auth/operation-not-allowed": t("error_operation_not_allowed"),
      };
      setError(messages[err.code] || t("error_occurred") + " " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-gradient)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-strong rounded-3xl p-10 max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <UserPlus size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('register_desc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('password')}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('confirm_password')}</label>
            <input type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200" />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </motion.div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={18} /> {t('register')}</>}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('have_account')} <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">{t('login')}</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
