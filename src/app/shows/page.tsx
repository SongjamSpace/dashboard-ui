"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
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
} from "lucide-react";
import Navbar from "@/components/navbar";

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
  status?: "live" | "viral" | "trending" | "upcoming" | "ended";
  participants?: string[]; // profile image URLs
}

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

// Generate random participant combinations using mock images
const generateRandomParticipants = (
  count: number = Math.floor(Math.random() * 4) + 1
): string[] => {
  const mockImages = [
    "/images/mock/1.jpg",
    "/images/mock/2.jpg",
    "/images/mock/3.png",
    "/images/mock/4.jpg",
  ];

  const shuffled = [...mockImages].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, mockImages.length));
};

// Mock data for shows
const mockShows: ScheduledShow[] = [
  {
    id: "1",
    showName: "Crypto Weekly Roundup",
    description:
      "Weekly discussion on the latest crypto trends, market analysis, and emerging projects",
    coverImage: "/images/mock/1.jpg",
    duration: 60,
    day: 1, // Monday
    time: "15:00",
    pattern: "weekdays",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "live",
    participants: generateRandomParticipants(2),
  },
  {
    id: "2",
    showName: "DeFi Deep Dive",
    description:
      "Technical analysis of DeFi protocols, yield farming strategies, and risk assessment",
    coverImage: "/images/mock/3.png",
    duration: 90,
    day: 3, // Wednesday
    time: "18:00",
    pattern: "specific-days",
    days: [1, 3, 5], // Monday, Wednesday, Friday
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "viral",
    participants: generateRandomParticipants(1),
  },
  {
    id: "3",
    showName: "NFT Market Watch",
    description:
      "Exploring NFT collections, artist spotlights, and marketplace trends",
    coverImage: "/images/mock/2.jpg",
    duration: 45,
    day: 5, // Friday
    time: "20:00",
    pattern: "specific-days",
    days: [5], // Friday only
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "trending",
    participants: generateRandomParticipants(3),
  },
  {
    id: "4",
    showName: "Blockchain Builders",
    description:
      "Interviews with developers, founders, and innovators in the blockchain space",
    coverImage: "/images/mock/4.jpg",
    duration: 75,
    day: 2, // Tuesday
    time: "16:30",
    pattern: "specific-days",
    days: [2, 4], // Tuesday, Thursday
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "upcoming",
    participants: generateRandomParticipants(2),
  },
];

// Mock analytics data
const mockAnalytics: Record<string, ShowAnalytics> = {
  "1": {
    totalListeners: 2847,
    reach: {
      views: 15420,
      likes: 892,
      replies: 234,
      reposts: 156,
    },
    engagement: {
      averageListenTime: 42,
      peakListeners: 456,
      completionRate: 73,
    },
    demographics: {
      topCountries: [
        "United States",
        "United Kingdom",
        "Canada",
        "Germany",
        "Australia",
      ],
      ageGroups: [
        { range: "18-24", percentage: 15 },
        { range: "25-34", percentage: 35 },
        { range: "35-44", percentage: 28 },
        { range: "45-54", percentage: 15 },
        { range: "55+", percentage: 7 },
      ],
    },
  },
  "2": {
    totalListeners: 1923,
    reach: {
      views: 12350,
      likes: 654,
      replies: 189,
      reposts: 98,
    },
    engagement: {
      averageListenTime: 65,
      peakListeners: 312,
      completionRate: 81,
    },
    demographics: {
      topCountries: [
        "United States",
        "Singapore",
        "Switzerland",
        "Japan",
        "Netherlands",
      ],
      ageGroups: [
        { range: "18-24", percentage: 12 },
        { range: "25-34", percentage: 42 },
        { range: "35-44", percentage: 31 },
        { range: "45-54", percentage: 12 },
        { range: "55+", percentage: 3 },
      ],
    },
  },
  "3": {
    totalListeners: 3421,
    reach: {
      views: 18750,
      likes: 1245,
      replies: 387,
      reposts: 234,
    },
    engagement: {
      averageListenTime: 38,
      peakListeners: 687,
      completionRate: 68,
    },
    demographics: {
      topCountries: [
        "United States",
        "United Kingdom",
        "France",
        "Brazil",
        "India",
      ],
      ageGroups: [
        { range: "18-24", percentage: 28 },
        { range: "25-34", percentage: 39 },
        { range: "35-44", percentage: 22 },
        { range: "45-54", percentage: 8 },
        { range: "55+", percentage: 3 },
      ],
    },
  },
  "4": {
    totalListeners: 1567,
    reach: {
      views: 9840,
      likes: 432,
      replies: 145,
      reposts: 67,
    },
    engagement: {
      averageListenTime: 58,
      peakListeners: 289,
      completionRate: 77,
    },
    demographics: {
      topCountries: ["United States", "Germany", "Canada", "Sweden", "Estonia"],
      ageGroups: [
        { range: "18-24", percentage: 8 },
        { range: "25-34", percentage: 45 },
        { range: "35-44", percentage: 34 },
        { range: "45-54", percentage: 11 },
        { range: "55+", percentage: 2 },
      ],
    },
  },
};

const getDayName = (day: number): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day];
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatPattern = (show: ScheduledShow): string => {
  switch (show.pattern) {
    case "daily":
      return "Daily";
    case "weekdays":
      return "Weekdays";
    case "one-time":
      return "One-time";
    case "specific-days":
      if (show.days && show.days.length > 0) {
        const dayNames = show.days.map((day) => getDayName(day).slice(0, 3));
        return dayNames.join(", ");
      }
      return "Custom";
    default:
      return "Unknown";
  }
};

export default function ShowsPage() {
  const [selectedShow, setSelectedShow] = useState<ScheduledShow | null>(null);
  const [selectedAnalytics, setSelectedAnalytics] =
    useState<ShowAnalytics | null>(null);

  const handleShowSelect = (show: ScheduledShow) => {
    setSelectedShow(show);
    setSelectedAnalytics(mockAnalytics[show.id] || null);
  };

  const handleBackToList = () => {
    setSelectedShow(null);
    setSelectedAnalytics(null);
  };

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
          X Space Shows
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl max-w-4xl mx-auto drop-shadow-lg text-white/90 px-4"
          style={{ fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Book a show to promote your brand
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {!selectedShow ? (
              /* Shows List */
              <motion.div
                key="shows-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {mockShows.map((show, index) => (
                  <motion.div
                    key={show.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShowSelect(show)}
                  >
                    {/* Cover Image */}
                    <div className="h-64 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center relative overflow-hidden">
                      {show.coverImage ? (
                        <img
                          src={show.coverImage}
                          alt={show.showName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <BarChart3 className="w-16 h-16 text-white/50" />
                      )}

                      {/* Status Tag */}
                      {show.status && (
                        <div
                          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            show.status === "live"
                              ? "bg-red-500 text-white animate-pulse"
                              : show.status === "viral"
                              ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white"
                              : show.status === "trending"
                              ? "bg-gradient-to-r from-green-500 to-blue-500 text-white"
                              : show.status === "upcoming"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {show.status === "live" && "🔴 "}
                          {show.status}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-white text-xs font-medium">
                          View Analytics
                        </span>
                      </div>
                    </div>

                    {/* Show Details */}
                    <div className="p-6">
                      <h3
                        className="text-white font-bold text-xl mb-3 line-clamp-2"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        {show.showName}
                      </h3>
                      <p
                        className="text-white/70 text-sm mb-4 line-clamp-3"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {show.description}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center text-white/80 text-sm">
                          <Clock className="w-4 h-4 mr-2 text-purple-400" />
                          <span>{show.duration} minutes</span>
                        </div>
                        <div className="flex items-center text-white/80 text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                          <span>
                            {formatPattern(show)} • {formatTime(show.time)}
                          </span>
                        </div>

                        {/* Participants and Book Button */}
                        <div className="flex items-center justify-between pt-2">
                          {show.participants && show.participants.length > 0 ? (
                            <div className="flex items-center">
                              <span className="text-white/60 text-xs mr-3">
                                Participants:
                              </span>
                              <div className="flex -space-x-2">
                                {show.participants
                                  .slice(0, 3)
                                  .map((profile, index) => (
                                    <img
                                      key={index}
                                      src={profile}
                                      alt={`Participant ${index + 1}`}
                                      className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 object-cover"
                                    />
                                  ))}
                                {show.participants.length > 3 && (
                                  <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
                                    <span className="text-white/60 text-xs font-medium">
                                      +{show.participants.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div></div>
                          )}

                          {/* Book Show Button */}
                          <motion.button
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 text-sm"
                            style={{ fontFamily: "Orbitron, sans-serif" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Book show: ${show.showName}`);
                            }}
                          >
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Book Show
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* Show Analytics */
              <motion.div
                key="show-analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Back Button */}
                <motion.button
                  onClick={handleBackToList}
                  className="flex items-center text-white/80 hover:text-white transition-colors duration-200 mb-6"
                  whileHover={{ x: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span style={{ fontFamily: "Inter, sans-serif" }}>
                    Back to Shows
                  </span>
                </motion.button>

                {/* Show Header */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedShow.coverImage ? (
                        <img
                          src={selectedShow.coverImage}
                          alt={selectedShow.showName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BarChart3 className="w-8 h-8 text-white/50" />
                      )}
                    </div>
                    <div>
                      <h2
                        className="text-2xl md:text-3xl font-bold text-white mb-2"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        {selectedShow.showName}
                      </h2>
                      <p
                        className="text-white/70 text-sm md:text-base mb-4"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {selectedShow.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-white/80">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-purple-400" />
                          {selectedShow.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-purple-400" />
                          {formatPattern(selectedShow)} •{" "}
                          {formatTime(selectedShow.time)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAnalytics && (
                  <>
                    {/* Key Metrics */}
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
                          {selectedAnalytics.totalListeners.toLocaleString()}
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
                          {selectedAnalytics.reach.views.toLocaleString()}
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
                          {selectedAnalytics.reach.likes.toLocaleString()}
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
                            selectedAnalytics.reach.replies +
                            selectedAnalytics.reach.reposts
                          ).toLocaleString()}
                        </div>
                        <div className="text-orange-400 text-sm font-medium">
                          Engagements
                        </div>
                      </motion.div>
                    </div>

                    {/* Detailed Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Reach Breakdown */}
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
                              {selectedAnalytics.reach.views.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Heart className="w-5 h-5 text-red-400 mr-2" />
                              <span className="text-white/80">Likes</span>
                            </div>
                            <span className="text-white font-semibold">
                              {selectedAnalytics.reach.likes.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <MessageCircle className="w-5 h-5 text-green-400 mr-2" />
                              <span className="text-white/80">Replies</span>
                            </div>
                            <span className="text-white font-semibold">
                              {selectedAnalytics.reach.replies.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Repeat2 className="w-5 h-5 text-purple-400 mr-2" />
                              <span className="text-white/80">Reposts</span>
                            </div>
                            <span className="text-white font-semibold">
                              {selectedAnalytics.reach.reposts.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Engagement Metrics */}
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
                            <span className="text-white/80">
                              Avg. Listen Time
                            </span>
                            <span className="text-white font-semibold">
                              {selectedAnalytics.engagement.averageListenTime}{" "}
                              min
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">
                              Peak Listeners
                            </span>
                            <span className="text-white font-semibold">
                              {selectedAnalytics.engagement.peakListeners.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">
                              Completion Rate
                            </span>
                            <span className="text-white font-semibold">
                              {selectedAnalytics.engagement.completionRate}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Demographics */}
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
                            {selectedAnalytics.demographics.topCountries.map(
                              (country, index) => (
                                <div
                                  key={country}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-white/70 text-sm">
                                    {index + 1}. {country}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white/80 font-medium mb-3">
                            Age Groups
                          </h4>
                          <div className="space-y-2">
                            {selectedAnalytics.demographics.ageGroups.map(
                              (group) => (
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
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
