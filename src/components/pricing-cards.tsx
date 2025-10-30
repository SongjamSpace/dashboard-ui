"use client";

import { motion } from "framer-motion";
import { Check, Calendar } from "lucide-react";
import type { ScheduledShow as DBScheduledShow } from "@/services/db/shows.db";

interface PricingCardsProps {
  show: DBScheduledShow;
  onBook?: (cardTitle: string, show: DBScheduledShow) => void;
}

export default function PricingCards({ show, onBook }: PricingCardsProps) {
  const cards = show.pricingCards || [];

  if (!cards || cards.length === 0) {
    return null;
  }

  const handleBook = (cardTitle: string) => {
    if (onBook) onBook(cardTitle, show);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="text-xl md:text-2xl font-bold text-white"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Select Your Package
          </h3>
          <p
            className="text-white/70 text-sm mt-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Choose a tier to promote with {show.showName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={`${card.title}-${idx}`}
            className={
              "rounded-xl p-5 border transition-all duration-300 bg-white/5 border-white/20"
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx }}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {card.title}
                </h4>
                {card.description && (
                  <p className="text-white/70 text-xs">{card.description}</p>
                )}
              </div>
              <div
                className="text-xl font-bold text-white"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {card.pricing >= 0 ? `$${card.pricing}` : "Contact"}
              </div>
            </div>

            {Array.isArray(card.includedServices) &&
              card.includedServices.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {card.includedServices.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-400" />
                      <span className="text-white/80 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

            <motion.button
              className="w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-all duration-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              style={{ fontFamily: "Inter, sans-serif" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleBook(card.title)}
            >
              <Calendar className="w-4 h-4" /> Book
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


