"use client";

import { motion } from "framer-motion";
import { Check, Calendar, Loader2 } from "lucide-react";
import type { ScheduledShow as DBScheduledShow } from "@/services/db/shows.db";

interface PricingCardsProps {
  show: DBScheduledShow;
  onBook?: (cardTitle: string, show: DBScheduledShow) => void;
  bookingLoading?: boolean;
  isBooked?: boolean;
  disabled?: boolean;
}

export default function PricingCards({
  show,
  onBook,
  bookingLoading,
  isBooked,
  disabled,
}: PricingCardsProps) {
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
            style={{ fontFamily: "Inter, sans-serif" }}
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
            key={`${card.label}-${idx}`}
            className={
              "rounded-xl p-5 border transition-all duration-300 bg-white/5 border-white/20 flex flex-col h-full"
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx }}
            whileHover={{ y: -4 }}
          >
            <div className="mb-4">
              <h4
                className="text-xl font-bold text-white mb-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {card.label}
              </h4>
              {card.description && (
                <p className="text-white text-sm leading-relaxed mb-4">
                  {card.description}
                </p>
              )}
            </div>

            {Array.isArray(card.includedServices) &&
              card.includedServices.length > 0 && (
                <div className="flex-1">
                  <h5
                    className="text-base font-semibold text-white mb-3"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    What's Included
                  </h5>
                  <ul className="space-y-3 mb-6">
                    {card.includedServices.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check className="w-5 h-5 mt-0.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/90 text-sm leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <motion.button
              className={`w-full mt-auto flex flex-col items-center justify-center gap-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-white ${
                isBooked
                  ? "bg-emerald-600/80 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
              whileHover={isBooked ? undefined : { scale: 1.02 }}
              whileTap={isBooked ? undefined : { scale: 0.98 }}
              onClick={() => handleBook(card.label)}
              disabled={Boolean(disabled || bookingLoading || isBooked)}
            >
              {bookingLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Booking...
                </div>
              ) : isBooked ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Booked
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Book Now
                  </div>
                  <div className="text-lg font-bold">
                    {card.pricing >= 0 ? `$${card.pricing}` : "Contact Us"}
                  </div>
                </>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
