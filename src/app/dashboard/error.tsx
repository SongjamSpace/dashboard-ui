"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)] flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          ⚠️
        </motion.div>
        <motion.h2
          className="text-3xl font-bold text-white mb-4"
          style={{ fontFamily: "Orbitron, sans-serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Dashboard Error
        </motion.h2>
        <motion.p
          className="text-white/70 mb-6"
          style={{ fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Something went wrong while loading your dashboard. Please try again.
        </motion.p>
        <motion.div
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            style={{ fontFamily: "Inter, sans-serif" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
          <Link href="/">
            <motion.button
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
              style={{ fontFamily: "Inter, sans-serif" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Go Home
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
