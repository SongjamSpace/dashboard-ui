"use client";

import { ScheduledShow } from "@/services/db/shows.db";
import { motion } from "framer-motion";

interface ScheduleCalendarProps {
  scheduledShows: ScheduledShow[];
  selectedSlots: { day: number; time: string }[];
  selectedPattern: "one-time" | "specific-days" | "weekdays" | "daily";
  onSlotSelect: (day: number, time: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12 AM to 11 PM (0-23)
const TIME_SLOTS = HOURS.flatMap((hour) => [
  `${hour.toString().padStart(2, "0")}:00`,
  `${hour.toString().padStart(2, "0")}:30`,
]);

// Helper function to convert time string to minutes since midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper function to get time slots that a show occupies based on its duration
const getShowTimeSlots = (startTime: string, duration: number): string[] => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  const occupiedSlots: string[] = [];

  for (const slot of TIME_SLOTS) {
    const slotMinutes = timeToMinutes(slot);
    // Check if this slot starts within the show's duration
    if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
      occupiedSlots.push(slot);
    }
  }

  return occupiedSlots;
};

// Helper function to check if a time slot is occupied by a show (considering duration)
const isTimeSlotOccupiedByShow = (
  show: ScheduledShow,
  day: number,
  time: string
): boolean => {
  // Check if any schedule entry matches the current day and time
  return show.schedule.some((scheduleItem) => {
    const scheduleDate = new Date(scheduleItem.date);
    const scheduleDay = scheduleDate.getDay();

    // Check if the day matches
    if (scheduleDay !== day) return false;

    // Check if the time slot is occupied by this show
    const occupiedSlots = getShowTimeSlots(scheduleItem.time, show.duration);
    return occupiedSlots.includes(time);
  });
};

// Helper function to check if this is the first slot of a show (where details should be displayed)
const isFirstSlotOfShow = (
  show: ScheduledShow,
  day: number,
  time: string
): boolean => {
  // Check if any schedule entry matches the current day and time exactly
  return show.schedule.some((scheduleItem) => {
    const scheduleDate = new Date(scheduleItem.date);
    const scheduleDay = scheduleDate.getDay();

    return scheduleDay === day && scheduleItem.time === time;
  });
};

// Helper function to calculate how many slots a show spans
const getShowSlotSpan = (duration: number): number => {
  return Math.ceil(duration / 30); // Each slot is 30 minutes
};

// Helper function to get the show that should be rendered in a merged block
const getShowForMergedBlock = (
  day: number,
  time: string,
  shows: ScheduledShow[]
): { show: ScheduledShow; span: number } | null => {
  for (const show of shows) {
    if (isFirstSlotOfShow(show, day, time)) {
      const span = getShowSlotSpan(show.duration);
      return { show, span };
    }
  }
  return null;
};

// Helper function to check if a slot should be hidden (part of a merged block)
const shouldHideSlot = (
  day: number,
  time: string,
  shows: ScheduledShow[]
): boolean => {
  const timeIndex = TIME_SLOTS.indexOf(time);
  if (timeIndex === -1) return false;

  // Check if this slot is covered by a show that starts earlier
  for (let i = 0; i < timeIndex; i++) {
    const earlierTime = TIME_SLOTS[i];
    const showForEarlierSlot = getShowForMergedBlock(day, earlierTime, shows);

    if (showForEarlierSlot) {
      const { span } = showForEarlierSlot;
      const endIndex = i + span;
      if (timeIndex < endIndex) {
        return true;
      }
    }
  }

  return false;
};

export default function ScheduleCalendar({
  scheduledShows,
  selectedSlots,
  selectedPattern,
  onSlotSelect,
}: ScheduleCalendarProps) {
  console.log({ scheduledShows });
  const isSlotOccupied = (day: number, time: string) => {
    return scheduledShows.some((show) => {
      return isTimeSlotOccupiedByShow(show, day, time);
    });
  };

  const getShowForSlot = (day: number, time: string) => {
    return scheduledShows.find((show) => {
      return isFirstSlotOfShow(show, day, time);
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
      {/* Calendar Container with Horizontal and Vertical Scroll */}
      <div className="overflow-auto max-h-[80vh] relative">
        <div className="min-w-[1000px]">
          {/* Calendar Header - Sticky */}
          <div className="sticky top-0 z-20">
            <div className="grid grid-cols-8 gap-1 mb-4">
              <div
                className="text-center text-white/60 text-sm font-medium min-w-[125px] sticky left-0 z-30"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: "#2C2B2C",
                }}
              ></div>
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className="text-center text-white font-medium text-sm p-2 min-w-[125px]"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "#2C2B2C",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="">
            {TIME_SLOTS.map((time, timeIndex) => (
              <div key={time} className="relative grid grid-cols-8 gap-1">
                {/* Time Label - Sticky */}
                <div
                  className="flex items-center justify-center h-10 md:h-12 min-w-[125px] sticky left-0 z-10"
                  style={{ backgroundColor: "#2C2B2C" }}
                >
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
                  const mergedBlock = getShowForMergedBlock(
                    dayIndex,
                    time,
                    scheduledShows
                  );
                  const shouldHide = shouldHideSlot(
                    dayIndex,
                    time,
                    scheduledShows
                  );

                  // If this slot is part of any merged block (including first slot), render invisible placeholder
                  if (shouldHide || mergedBlock) {
                    return (
                      <div
                        key={`${dayIndex}-${time}`}
                        className="h-10 md:h-12 min-w-[125px] relative"
                      >
                        {/* Only render the merged block on the first slot */}
                        {mergedBlock && (
                          <motion.div
                            key={`${dayIndex}-${time}-merged`}
                            className="absolute top-0 left-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-indigo-400/40 rounded-lg transition-all duration-200 z-1"
                            style={{
                              height: `${
                                44 * mergedBlock.span +
                                4 * (mergedBlock.span - 1)
                              }px`,
                              width: "100%",
                            }}
                            whileHover={{ scale: 1.02, zIndex: 30 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="p-2 h-full flex items-center justify-center">
                              <span
                                className="text-white text-xs font-medium text-center"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                {mergedBlock.show.showName}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  }

                  // If this slot is occupied by a show (30-min shows only, since merged blocks are handled above)
                  if (isOccupied && show) {
                    return (
                      <motion.div
                        key={`${dayIndex}-${time}`}
                        className="h-10 md:h-12 rounded-lg border-2 transition-all duration-200 min-w-[125px] bg-white/10 border-white/20"
                        whileHover={{ scale: 1 }}
                      >
                        <div className="p-2 h-full flex items-center justify-center">
                          <span
                            className="text-white text-xs font-medium text-center"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {show.showName}
                          </span>
                        </div>
                      </motion.div>
                    );
                  }

                  // Regular slot rendering for available/selected slots
                  return (
                    <motion.div
                      key={`${dayIndex}-${time}`}
                      className={`h-10 md:h-12 rounded-lg border-2 transition-all duration-200 cursor-pointer min-w-[125px] ${
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
                      onClick={() =>
                        !isOccupied && onSlotSelect(dayIndex, time)
                      }
                    >
                      {isSelected ? (
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
        </div>
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
          <div className="w-3 h-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 rounded"></div>
          <span className="text-white/60">Scheduled Show</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500/20 border border-red-400/50 rounded"></div>
          <span className="text-white/60">Conflict</span>
        </div>
      </div>
    </div>
  );
}
