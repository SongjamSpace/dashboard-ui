"use client";

import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";

interface ScheduledShow {
  id: string;
  showName: string;
  description: string;
  coverImage?: string;
  duration: number; // in minutes
  day: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // HH:MM format
  pattern: "one-time" | "specific-days" | "weekdays" | "daily";
  days?: number[]; // for specific-days pattern
  startDate?: string; // for one-time shows
  endDate?: string; // for recurring shows
}

interface ScheduleCalendarProps {
  scheduledShows: ScheduledShow[];
  selectedSlots: { day: number; time: string }[];
  selectedPattern: "one-time" | "specific-days" | "weekdays" | "daily";
  onSlotSelect: (day: number, time: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
const TIME_SLOTS = HOURS.flatMap((hour) => [
  `${hour.toString().padStart(2, "0")}:00`,
  `${hour.toString().padStart(2, "0")}:30`,
]);

export default function ScheduleCalendar({
  scheduledShows,
  selectedSlots,
  selectedPattern,
  onSlotSelect,
}: ScheduleCalendarProps) {
  const isSlotOccupied = (day: number, time: string) => {
    return scheduledShows.some((show) => {
      if (show.pattern === "one-time") {
        return show.day === day && show.time === time;
      } else if (show.pattern === "weekdays") {
        return show.day === day && show.time === time && day >= 1 && day <= 5;
      } else if (show.pattern === "daily") {
        return show.day === day && show.time === time;
      } else if (show.pattern === "specific-days") {
        return show.days?.includes(day) && show.time === time;
      }
      return false;
    });
  };

  const getShowForSlot = (day: number, time: string) => {
    return scheduledShows.find((show) => {
      if (show.pattern === "one-time") {
        return show.day === day && show.time === time;
      } else if (show.pattern === "weekdays") {
        return show.day === day && show.time === time && day >= 1 && day <= 5;
      } else if (show.pattern === "daily") {
        return show.day === day && show.time === time;
      } else if (show.pattern === "specific-days") {
        return show.days?.includes(day) && show.time === time;
      }
      return false;
    });
  };

  const isSlotSelected = (day: number, time: string) => {
    return selectedSlots.some((slot) => slot.day === day && slot.time === time);
  };

  const isSlotHighlighted = (day: number, time: string) => {
    // If no slots are selected, don't highlight anything
    if (selectedSlots.length === 0) return false;

    // Get the first selected slot as reference
    const referenceSlot = selectedSlots[0];

    // Highlight based on pattern
    switch (selectedPattern) {
      case "weekdays":
        return day >= 1 && day <= 5 && time === referenceSlot.time;
      case "daily":
        return time === referenceSlot.time;
      case "specific-days":
        // For specific days, we'll highlight the same time across all days
        // The user can then select which specific days they want
        return time === referenceSlot.time;
      case "one-time":
      default:
        return false; // No highlighting for one-time shows
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="p-4 md:p-6">
      {/* Calendar Header */}
      <div className="grid grid-cols-8 gap-1 mb-4">
        <div
          className="text-center text-white/60 text-sm font-medium"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Time
        </div>
        {DAYS.map((day, index) => (
          <div
            key={day}
            className="text-center text-white font-medium text-sm p-2"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {TIME_SLOTS.map((time, timeIndex) => (
          <div key={time} className="grid grid-cols-8 gap-1">
            {/* Time Label */}
            <div className="flex items-center justify-center h-10 md:h-12">
              <span
                className="text-white/60 text-xs font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {formatTime(time)}
              </span>
            </div>

            {/* Day Columns */}
            {DAYS.map((_, dayIndex) => {
              const isOccupied = isSlotOccupied(dayIndex, time);
              const isSelected = isSlotSelected(dayIndex, time);
              const isHighlighted = isSlotHighlighted(dayIndex, time);
              const show = getShowForSlot(dayIndex, time);
              const isConflict = isOccupied && isSelected;

              return (
                <motion.div
                  key={`${dayIndex}-${time}`}
                  className={`h-10 md:h-12 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    isConflict
                      ? "bg-red-500/20 border-red-400/50"
                      : isSelected
                      ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50"
                      : isHighlighted && !isOccupied
                      ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/30"
                      : isOccupied
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                  whileHover={{ scale: isOccupied ? 1 : 1.02 }}
                  whileTap={{ scale: isOccupied ? 1 : 0.98 }}
                  onClick={() => !isOccupied && onSlotSelect(dayIndex, time)}
                >
                  {isOccupied && show ? (
                    <div className="p-2 h-full flex flex-col justify-center">
                      <div className="flex items-center space-x-1 mb-1">
                        <User className="w-3 h-3 text-white/70" />
                        <span
                          className="text-white text-xs font-medium truncate"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {show.showName}
                        </span>
                      </div>
                      <div
                        className="text-white/60 text-xs truncate"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {show.duration}min
                      </div>
                    </div>
                  ) : isSelected ? (
                    <div className="p-2 h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  ) : isHighlighted && !isOccupied ? (
                    <div className="p-2 h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60"></div>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        className="mt-6 flex flex-wrap gap-4 text-xs"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white/5 border border-white/10 rounded"></div>
          <span className="text-white/60">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 rounded"></div>
          <span className="text-white/60">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded"></div>
          <span className="text-white/60">Pattern Preview</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white/10 border border-white/20 rounded"></div>
          <span className="text-white/60">Occupied</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500/20 border border-red-400/50 rounded"></div>
          <span className="text-white/60">Conflict</span>
        </div>
      </div>
    </div>
  );
}
