"use client";

import { motion } from "framer-motion";
import { Clock, Calendar, Repeat, CalendarDays } from "lucide-react";

interface RecurringPatternSelectorProps {
  selectedPattern: "one-time" | "specific-days" | "weekdays" | "daily";
  onPatternChange: (
    pattern: "one-time" | "specific-days" | "weekdays" | "daily"
  ) => void;
}

const PATTERNS = [
  {
    id: "one-time" as const,
    label: "One-time Show",
    description: "Schedule a single show",
    icon: Calendar,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-400/30",
  },
  {
    id: "specific-days" as const,
    label: "Specific Days",
    description: "Mon, Tue, Wed, Thu at 5:30pm",
    icon: CalendarDays,
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-400/30",
  },
  {
    id: "weekdays" as const,
    label: "Every Weekday",
    description: "Monday to Friday",
    icon: Repeat,
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-400/30",
  },
  {
    id: "daily" as const,
    label: "Every Day",
    description: "7 days a week",
    icon: Clock,
    color: "from-orange-500/20 to-red-500/20",
    borderColor: "border-orange-400/30",
  },
];

export default function RecurringPatternSelector({
  selectedPattern,
  onPatternChange,
}: RecurringPatternSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {PATTERNS.map((pattern) => {
        const IconComponent = pattern.icon;
        const isSelected = selectedPattern === pattern.id;

        return (
          <motion.button
            key={pattern.id}
            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              isSelected
                ? `${pattern.color} ${pattern.borderColor} border-opacity-50`
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPatternChange(pattern.id)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 ${
                    isSelected ? "text-white" : "text-white/70"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h4
                  className={`font-semibold text-sm ${
                    isSelected ? "text-white" : "text-white/90"
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {pattern.label}
                </h4>
                <p
                  className={`text-xs ${
                    isSelected ? "text-white/80" : "text-white/60"
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {pattern.description}
                </p>
              </div>
              {isSelected && (
                <motion.div
                  className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
