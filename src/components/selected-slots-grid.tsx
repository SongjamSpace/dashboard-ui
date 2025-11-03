"use client";

import { Clock, Calendar } from "lucide-react";

interface SelectedSlotsGridProps {
  selectedSlots: { day: number; time: string }[];
}

const formatTime24h = (time: string) => {
  // Return time as-is in 24-hour format (e.g., "14:30", "09:00")
  return time;
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_ABBREVIATIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SelectedSlotsGrid({
  selectedSlots,
}: SelectedSlotsGridProps) {
  // Group slots by day
  const slotsByDay = selectedSlots.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = [];
    }
    acc[slot.day].push(slot.time);
    return acc;
  }, {} as Record<number, string[]>);

  // Sort times within each day
  Object.keys(slotsByDay).forEach((day) => {
    slotsByDay[Number(day)].sort();
  });

  return (
    <div className="border border-white/20 rounded-xl bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="bg-white/10 px-4 py-3 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-white/70" />
          <div>
            <h3
              className="text-white font-semibold text-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Selected Time Slots
            </h3>
            <p
              className="text-white/50 text-xs"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              24-hour format
            </p>
          </div>
          <span className="text-white/60 text-xs ml-auto">
            {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAYS.map((dayName, dayIndex) => {
            const times = slotsByDay[dayIndex] || [];
            const hasSlots = times.length > 0;

            return (
              <div key={dayIndex} className="space-y-2">
                {/* Day Header */}
                <div className="flex items-center space-x-2 pb-1 border-b border-white/10">
                  <span
                    className="text-white font-medium text-xs"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {DAY_ABBREVIATIONS[dayIndex]}
                  </span>
                  {hasSlots && (
                    <span className="text-white/50 text-xs">
                      ({times.length})
                    </span>
                  )}
                </div>

                {/* Time Chips */}
                {hasSlots ? (
                  <div className="flex flex-col gap-1.5">
                    {times.map((time) => (
                      <div
                        key={`${dayIndex}-${time}`}
                        className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors group"
                      >
                        <Clock className="w-3 h-3 text-white/70 flex-shrink-0 group-hover:text-white/90 transition-colors" />
                        <span
                          className="text-white text-xs font-medium"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {formatTime24h(time)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <span
                      className="text-white/20 text-xs"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      —
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
