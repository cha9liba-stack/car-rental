"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Car, Eye, EyeOff, LogIn, UserCircle } from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import { useLang } from "@/components/layout/language-provider";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginAnonymously } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      const messages: Record<string, string> = {
        "auth/user-not-found": t("error_user_not_found"),
        "auth/wrong-password": t("error_wrong_password"),
        "auth/invalid-credential": t("error_invalid_credential"),
        "auth/invalid-email": t("error_invalid_email"),
        "auth/too-many-requests": t("error_too_many_requests"),
      };
      setError(messages[err.code] || t("error_login_generic"));
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Car size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('appName')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('login_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 text-sm text-red-600 dark:text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn size={18} /> {t('login')}</>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/80 dark:bg-gray-900/80 px-3 text-gray-400">{t('or')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await loginAnonymously();
                router.push("/");
              } catch (err: any) {
                setError(err.message || t("error_occurred"));
              }
            }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-medium hover:bg-white/30 dark:hover:bg-white/5 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <UserCircle size={18} />
            {t('login_anonymous')}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('no_account')} <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">{t('create_account')}</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
