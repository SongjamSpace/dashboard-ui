"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  BarChart3,
  TrendingUp,
  Crown,
} from "lucide-react";
import type { ParticipantProfile, ScheduledShow } from "@/services/db/shows.db";
import PricingCards from "@/components/pricing-cards";

interface ShowAnalytics {
  totalListeners: number;
  reach: {
    views: number;
    likes: number;
    replies: number;
    reposts: number;
  };
  engagement: {
    averageListenTime: number;
    peakListeners: number;
    completionRate: number;
  };
  demographics: {
    topCountries: string[];
    ageGroups: { range: string; percentage: number }[];
  };
}

interface ShowDetailsProps {
  show: ScheduledShow;
  analytics: ShowAnalytics | null;
  onBack: () => void;
  onBookTier: (tierId: string) => void;
  bookingLoading?: boolean;
  bookingDisabled?: boolean;
  isBooked?: boolean;
}

const getDayName = (date: string): string => {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayIndex = new Date(date).getDay();
  return dayNames[dayIndex];
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatSchedule = (show: ScheduledShow): string => {
  if (show.schedule.length === 0) return "No schedule";
  if (show.schedule.length === 1) {
    const { date, time } = show.schedule[0];
    return `${getDayName(date).slice(0, 3)} • ${formatTime(time)}`;
  }
  const days = show.schedule.map(({ date }) => getDayName(date).slice(0, 3));
  const uniqueDays = [...new Set(days)];
  if (uniqueDays.length === 1) {
    return `${uniqueDays[0]} • ${formatTime(show.schedule[0].time)}`;
  }
  return `${uniqueDays.join(", ")} • ${formatTime(show.schedule[0].time)}`;
};

export default function ShowDetails({
  show,
  analytics,
  onBack,
  onBookTier,
  bookingLoading,
  bookingDisabled,
  isBooked,
}: ShowDetailsProps) {
  const normalizeHandle = (value?: string): string =>
    (value || "").replace(/^@/, "").trim().toLowerCase();

  const creatorHandles = new Set<string>(
    [
      normalizeHandle((show.createdBy as any)?.username),
      normalizeHandle((show.createdBy as any)?.twitterScreenName),
      normalizeHandle(show.createdBy?.displayName),
    ].filter(Boolean) as string[]
  );
  return (
    <motion.div
      key="show-analytics"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.button
        onClick={onBack}
        className="flex items-center text-white/80 hover:text-white transition-colors duration-200 mb-6"
        whileHover={{ x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        <span style={{ fontFamily: "Inter, sans-serif" }}>Back to Shows</span>
      </motion.button>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {show.coverImage ? (
              <img
                src={show.coverImage}
                alt={show.showName}
                className="w-full h-full object-cover"
              />
            ) : (
              <BarChart3 className="w-8 h-8 text-white/50" />
            )}
          </div>
          <div className="flex-1">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {show.showName}
            </h2>
            <p
              className="text-white/70 text-sm md:text-base mb-4"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {show.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-purple-400" />
                {show.duration} minutes
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-purple-400" />
                {formatSchedule(show)}
              </div>
            </div>
          </div>
          {(show.spaceHistoryMetadata?.totalLiveListeners ||
            show.spaceHistoryMetadata?.totalReplayWatched ||
            show.spaceId) && (
            <div className="md:ml-auto w-full md:w-auto">
              <div className="bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-white/20 rounded-xl p-4 text-white/90 min-w-[260px]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-white/70">
                      Live Listeners
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {show.spaceHistoryMetadata?.totalLiveListeners?.toLocaleString?.() ??
                        0}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-white/70">
                      Replay Watched
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {show.spaceHistoryMetadata?.totalReplayWatched?.toLocaleString?.() ??
                        0}
                    </span>
                  </div>
                </div>
                {show.spaceHistoryMetadata?.spaceId && (
                  <a
                    href={`https://x.com/i/spaces/${show.spaceHistoryMetadata?.spaceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-sm transition-colors"
                  >
                    Watch Space
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        {show.participants && show.participants.length > 0 && (
          <div className="mt-6">
            <h3
              className="text-lg font-semibold text-white mb-3 text-center"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Participants
            </h3>
            <div
              className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex items-center gap-3 pb-1 justify-center flex-wrap">
                {show.participants.map((profile: ParticipantProfile, index) => {
                  const avatarSrc = profile.avatarUrl;
                  const displayName = profile.displayName;
                  const username = profile.twitterScreenName;
                  const isCreator =
                    creatorHandles.size > 0 &&
                    (creatorHandles.has(normalizeHandle(username)) ||
                      creatorHandles.has(normalizeHandle(displayName)));
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors text-white/90 flex-shrink-0 cursor-pointer ${
                        isCreator
                          ? "border-yellow-300/80 bg-yellow-500/10 hover:bg-yellow-500/15 shadow-[0_0_0_2px_rgba(234,179,8,0.2)]"
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={() =>
                        window.open(`https://x.com/${username}`, "_blank")
                      }
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={
                            displayName ||
                            username ||
                            `Participant ${index + 1}`
                          }
                          className={`w-6 h-6 rounded-full border object-cover ${
                            isCreator
                              ? "border-yellow-300/80 ring-2 ring-yellow-300/40"
                              : "border-white/20"
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-6 h-6 rounded-full border bg-white/10 ${
                            isCreator
                              ? "border-yellow-300/80 ring-2 ring-yellow-300/40"
                              : "border-white/20"
                          }`}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        {isCreator && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-300/30">
                            <Crown className="w-3 h-3" /> Host
                          </span>
                        )}
                        {displayName && (
                          <span className="text-sm font-medium text-white">
                            {displayName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing & What's Included */}
      {isBooked && (
        <div
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 rounded-xl p-4 text-sm"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          You have already booked this show. Feel free to reach out to the host
          if you need to make changes.
        </div>
      )}

      <PricingCards
        show={show}
        onBook={(tier) => onBookTier(tier)}
        bookingLoading={bookingLoading}
        disabled={bookingDisabled}
        isBooked={isBooked}
      />

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl border border-blue-400/30 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {analytics.totalListeners.toLocaleString()}
              </div>
              <div className="text-blue-400 text-sm font-medium">
                Total Listeners
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-purple-400/30 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-8 h-8 text-purple-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {analytics.reach.views.toLocaleString()}
              </div>
              <div className="text-purple-400 text-sm font-medium">
                Total Views
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl border border-green-400/30 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-8 h-8 text-green-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {analytics.reach.likes.toLocaleString()}
              </div>
              <div className="text-green-400 text-sm font-medium">
                Total Likes
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl border border-orange-400/30 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="w-8 h-8 text-orange-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {(
                  analytics.reach.replies + analytics.reach.reposts
                ).toLocaleString()}
              </div>
              <div className="text-orange-400 text-sm font-medium">
                Engagements
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3
                className="text-lg font-semibold text-white mb-4"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Reach Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-white/80">Views</span>
                  </div>
                  <span className="text-white font-semibold">
                    {analytics.reach.views.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 text-red-400 mr-2" />
                    <span className="text-white/80">Likes</span>
                  </div>
                  <span className="text-white font-semibold">
                    {analytics.reach.likes.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-white/80">Replies</span>
                  </div>
                  <span className="text-white font-semibold">
                    {analytics.reach.replies.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Repeat2 className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-white/80">Reposts</span>
                  </div>
                  <span className="text-white font-semibold">
                    {analytics.reach.reposts.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3
                className="text-lg font-semibold text-white mb-4"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Engagement Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Avg. Listen Time</span>
                  <span className="text-white font-semibold">
                    {analytics.engagement.averageListenTime} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Peak Listeners</span>
                  <span className="text-white font-semibold">
                    {analytics.engagement.peakListeners.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Completion Rate</span>
                  <span className="text-white font-semibold">
                    {analytics.engagement.completionRate}%
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3
              className="text-lg font-semibold text-white mb-4"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Audience Demographics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white/80 font-medium mb-3">
                  Top Countries
                </h4>
                <div className="space-y-2">
                  {analytics.demographics.topCountries.map((country, index) => (
                    <div
                      key={country}
                      className="flex items-center justify-between"
                    >
                      <span className="text-white/70 text-sm">
                        {index + 1}. {country}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white/80 font-medium mb-3">Age Groups</h4>
                <div className="space-y-2">
                  {analytics.demographics.ageGroups.map((group) => (
                    <div
                      key={group.range}
                      className="flex items-center justify-between"
                    >
                      <span className="text-white/70 text-sm">
                        {group.range}
                      </span>
                      <span className="text-white font-medium">
                        {group.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
