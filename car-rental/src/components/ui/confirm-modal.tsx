"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import Button from "./button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "danger",
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative w-full max-w-sm glass-strong rounded-3xl shadow-2xl p-6 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {cancelText}
              </Button>
              <Button
                variant={variant}
                onClick={() => { onConfirm(); onClose(); }}
                className="flex-1"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
