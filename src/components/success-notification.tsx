"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface SuccessNotificationProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export default function SuccessNotification({
  show,
  message,
  onClose,
}: SuccessNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p
                  className="text-white font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
