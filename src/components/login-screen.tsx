"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/navbar";

interface LoginScreenProps {
  login: () => void;
}

export default function LoginScreen({ login }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)]">
      {/* Navbar */}
      <div className="relative z-20 px-4 py-4">
        <Navbar />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center py-8 px-4">
        <motion.h1
          className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg text-white"
          style={{ fontFamily: "Orbitron, sans-serif" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Songjam Dashboard
        </motion.h1>
        <motion.p
          className="text-xl max-w-4xl mx-auto drop-shadow-lg text-white/90 mb-8"
          style={{ fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Sign in with Twitter to access your dashboard
        </motion.p>
      </div>

      {/* Login Section */}
      <div className="relative z-10 px-4 pb-8">
        <div className="max-w-md mx-auto">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3
              className="text-2xl font-bold text-white mb-4"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Welcome to Songjam
            </h3>
            <p
              className="text-white/80 mb-6"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Connect your Twitter/X account to access your Dealflow dashboard,
              book or be booked and track X Space engagement metrics.
            </p>
            <motion.button
              onClick={login}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-lg flex items-center justify-center gap-2"
              style={{ fontFamily: "Inter, sans-serif" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Continue with X
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
