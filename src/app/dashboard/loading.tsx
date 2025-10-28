"use client";

import { motion } from "framer-motion";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)] flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.h2
          className="text-2xl font-bold text-white mb-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Loading Dashboard
        </motion.h2>
        <motion.p
          className="text-white/70"
          style={{ fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Fetching your project analytics...
        </motion.p>
      </motion.div>
    </div>
  );
}
