"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Mic, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Trash } from "lucide-react";
import { deleteShow, ScheduledShow } from "@/services/db/shows.db";

interface UserShowCardProps {
  show: ScheduledShow;
  loadUserShows: () => void;
}

export default function UserShowCard({
  show,
  loadUserShows,
}: UserShowCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Display schedule date and time as provided in props without timezone conversion.
  const formatTime12Hour = (timeString: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(timeString);
    if (!match) return timeString;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${period}`;
  };

  const handleDelete = async () => {
    if (!show.id) return;
    const confirmDelete =
      typeof window !== "undefined"
        ? window.confirm("Delete this show permanently?")
        : true;
    if (!confirmDelete) return;
    try {
      setIsDeleting(true);
      // Hard delete the document
      await deleteShow(show.id, false);
      // Optional: notify user or trigger a refresh
      if (typeof window !== "undefined") {
        // Simple feedback; parent list should ideally refetch
        // eslint-disable-next-line no-alert
        alert("Show deleted.");
      }
      loadUserShows();
    } catch (err) {
      console.error("Failed to delete show", err);
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-alert
        alert("Failed to delete show. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Cover Image Placeholder */}
        <div className="h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          {show.coverImage ? (
            <img
              src={show.coverImage}
              alt={show.showName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Mic className="w-8 h-8 text-white/50" />
          )}
        </div>

        {/* Show Details */}
        <div className="p-4">
          <h4
            className="text-white font-semibold text-sm mb-1 truncate"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {show.showName}
          </h4>
          <p
            className="text-white/60 text-xs mb-2 line-clamp-2"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {show.description}
          </p>

          {/* Slots Section */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span
                className="text-white/50"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {show.schedule.length} slot{show.schedule.length > 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center text-white/70 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                {show.schedule.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs bg-white/5 rounded px-2 py-1"
                  >
                    <span
                      className="text-white/70"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {schedule.date}
                    </span>
                    <span
                      className="text-white/70"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {formatTime12Hour(schedule.time)}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Pricing Section */}
          {show.pricing && (
            <div className="flex items-center justify-between text-xs">
              <span
                className="text-white/50"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Pricing
              </span>
              <button
                onClick={() => setShowPricingPopup(true)}
                className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </button>
            </div>
          )}

          {/* Actions Footer */}
          <div className="mt-3 flex items-center justify-end">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-red-300 hover:text-red-200 disabled:opacity-50 text-xs"
              title="Delete show"
            >
              <Trash className="w-3 h-3" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Pricing Popup */}
      {showPricingPopup && show.pricing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Pricing Details
              </h3>
              <button
                onClick={() => setShowPricingPopup(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-white/70 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Price
                  </span>
                  <span
                    className="text-white font-semibold text-lg"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {show.pricing.currency} {show.pricing.price}
                  </span>
                </div>
                {show.pricing.details && (
                  <p
                    className="text-white/60 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {show.pricing.details}
                  </p>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4
                  className="text-white/70 text-sm font-semibold mb-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Show: {show.showName}
                </h4>
                <p
                  className="text-white/60 text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {show.description}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
