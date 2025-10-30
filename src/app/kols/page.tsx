"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Calendar, Clock, Mic, Plus, Settings } from "lucide-react";
import ScheduleCalendar from "@/components/schedule-calendar";
import ScheduleForm from "@/components/schedule-form";
import RecurringPatternSelector from "@/components/recurring-pattern-selector";
import SuccessNotification from "@/components/success-notification";
import Navbar from "@/components/navbar";
import UserShowCard from "@/components/user-show-card";
import { useAuth } from "@/components/providers";
import {
  createScheduledShow,
  getScheduledShowsByUser,
} from "@/services/db/shows.db";

interface ScheduledShow {
  id: string;
  showName: string;
  description: string;
  coverImage?: string;
  duration: number; // in minutes
  schedule: {
    date: string; // YYYY-MM-DD format
    time: string; // HH:MM format
  }[];
  pricing?: {
    price: number;
    currency: string;
    details?: string;
  };
}

export default function KOLsPage() {
  const { user, authenticated, twitterObj } = useAuth();
  const [selectedSlots, setSelectedSlots] = useState<
    { day: number; time: string }[]
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [userShows, setUserShows] = useState<ScheduledShow[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<
    "one-time" | "specific-days" | "weekdays" | "daily"
  >("one-time");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUserShows = async () => {
    if (authenticated && user) {
      try {
        setLoading(true);
        const shows = await getScheduledShowsByUser(user.uid);
        setUserShows(shows.map((s) => ({ ...s, id: s.id || "" })));
      } catch (error) {
        console.error("Error loading user shows:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  // Load user's shows from database
  useEffect(() => {
    fetchUserShows();
  }, [authenticated, user]);

  const handleSlotSelect = (day: number, time: string) => {
    const slotKey = `${day}-${time}`;
    const existingSlot = selectedSlots.find(
      (slot) => `${slot.day}-${slot.time}` === slotKey
    );

    if (existingSlot) {
      setSelectedSlots((prev) =>
        prev.filter((slot) => `${slot.day}-${slot.time}` !== slotKey)
      );
    } else {
      setSelectedSlots((prev) => [...prev, { day, time }]);
    }
  };

  const handleShowSubmit = async (showData: Omit<ScheduledShow, "id">) => {
    if (!authenticated || !user) {
      console.error("User not authenticated");
      return;
    }

    try {
      setLoading(true);

      // Create user object for the database
      const userObj = {
        uid: user.uid,
        username: twitterObj?.username || "",
        name: twitterObj?.name || "",
      };

      // Create the show in the database
      const showId = await createScheduledShow(showData as any, userObj as any);

      // Add the new show to local state with the generated ID
      const newShow: ScheduledShow = {
        ...showData,
        id: showId,
      };
      setUserShows((prev) => [...prev, newShow]);

      setShowForm(false);
      setSelectedSlots([]);
      setSuccessMessage(
        `"${showData.showName}" has been scheduled for ${
          showData.schedule.length
        } time slot${showData.schedule.length > 1 ? "s" : ""}!`
      );
      setShowSuccess(true);

      // Auto-hide success notification after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error creating show:", error);
      setSuccessMessage("Error creating show. Please try again.");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const allShows = [...userShows];

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
          X Space Scheduler
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl max-w-4xl mx-auto drop-shadow-lg text-white/90 px-4"
          style={{ fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Schedule your Twitter Space shows with ease
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* My Shows Section - Top Row */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center mb-4">
              <Calendar className="w-6 h-6 text-white/70 mr-3" />
              <h3
                className="text-xl font-semibold text-white"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                My Scheduled Shows
              </h3>
            </div>
            {userShows.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-white/50" />
                </div>
                <h4
                  className="text-lg font-semibold text-white mb-2"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  No shows scheduled yet
                </h4>
                <p
                  className="text-white/60 text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Create your first show by selecting a pattern and time slots
                  below
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {userShows.map((show) => (
                  <UserShowCard
                    key={show.id}
                    show={show}
                    loadUserShows={fetchUserShows}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Calendar and Form Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Calendar - Takes 2 columns */}
            <div className="xl:col-span-2">
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold text-white"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    Weekly Schedule
                  </h3>
                  <div className="flex items-center space-x-2 text-white/70">
                    <Clock className="w-4 h-4" />
                    <span
                      className="text-sm"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Local Time (
                      {Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </span>
                  </div>
                </div>
                <ScheduleCalendar
                  scheduledShows={allShows}
                  selectedSlots={selectedSlots}
                  selectedPattern={selectedPattern}
                  onSlotSelect={handleSlotSelect}
                />
              </motion.div>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="xl:col-span-1">
              <div className="space-y-4">
                {/* Schedule New Show */}
                <motion.div
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-purple-400/30 p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="flex items-center mb-3">
                    <Mic className="w-6 h-6 text-purple-400 mr-2" />
                    <h4
                      className="text-lg font-bold text-white"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      Schedule Show
                    </h4>
                  </div>
                  <p
                    className="text-white/80 text-sm mb-4"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {selectedSlots.length > 0
                      ? `${selectedSlots.length} time slot${
                          selectedSlots.length > 1 ? "s" : ""
                        } selected`
                      : "Select time slots to schedule your show"}
                  </p>
                  <motion.button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    whileHover={{ scale: selectedSlots.length > 0 ? 1.02 : 1 }}
                    whileTap={{ scale: selectedSlots.length > 0 ? 0.98 : 1 }}
                    onClick={() => setShowForm(true)}
                    disabled={selectedSlots.length === 0}
                  >
                    {selectedSlots.length > 0
                      ? "Configure Show"
                      : "Select Time Slots"}
                  </motion.button>
                </motion.div>

                {/* Pattern Selector */}
                <motion.div
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <h4
                    className="text-lg font-semibold text-white mb-2"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    Schedule Pattern
                  </h4>
                  <p
                    className="text-white/70 text-sm mb-4"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Select a pattern, then choose time slots in the calendar.
                    The pattern will show a preview of when your show will
                    repeat.
                  </p>
                  <RecurringPatternSelector
                    selectedPattern={selectedPattern}
                    onPatternChange={(
                      pattern:
                        | "one-time"
                        | "specific-days"
                        | "weekdays"
                        | "daily"
                    ) => {
                      setSelectedPattern(pattern);
                      setSelectedSlots([]); // Clear selections when pattern changes
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show Form Modal */}
      {showForm && (
        <ScheduleForm
          selectedSlots={selectedSlots}
          selectedPattern={selectedPattern}
          onClose={() => setShowForm(false)}
          onSubmit={handleShowSubmit}
        />
      )}

      {/* Success Notification */}
      <SuccessNotification
        show={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
