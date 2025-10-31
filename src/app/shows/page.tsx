"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
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
import {
  getAllShows,
  ParticipantProfile,
  type ScheduledShow,
} from "@/services/db/shows.db";
import ShowDetails from "@/components/show-details";
import { useAuth } from "@/components/providers";
import {
  createShowBooking,
  getShowBooking,
} from "@/services/db/showBookings.db";

// Using ScheduledShow type from db

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
): ParticipantProfile[] => {
  const mockImages = [
    "/images/mock/1.jpg",
    "/images/mock/2.jpg",
    "/images/mock/3.png",
    "/images/mock/4.jpg",
  ];

  const shuffled = [...mockImages].sort(() => Math.random() - 0.5);
  return shuffled
    .slice(0, Math.min(count, mockImages.length))
    .map((image, index) => ({
      avatarUrl: image,
      userId: `user_${Math.random().toString(36).substring(2, 15)}`,
      displayName: `Participant ${index + 1}`,
      username: `participant${index + 1}`,
      role: "regular",
    }));
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
    schedule: [
      { date: "2024-01-15", time: "15:00" },
      { date: "2024-01-22", time: "15:00" },
      { date: "2024-01-29", time: "15:00" },
    ],
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
    schedule: [
      { date: "2024-01-16", time: "18:00" },
      { date: "2024-01-18", time: "18:00" },
      { date: "2024-01-20", time: "18:00" },
    ],
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
    schedule: [
      { date: "2024-01-19", time: "20:00" },
      { date: "2024-01-26", time: "20:00" },
    ],
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
    schedule: [
      { date: "2024-01-17", time: "16:30" },
      { date: "2024-01-19", time: "16:30" },
    ],
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

  // For multiple dates, show the pattern
  const days = show.schedule.map(({ date }) => getDayName(date).slice(0, 3));
  const uniqueDays = [...new Set(days)];

  if (uniqueDays.length === 1) {
    return `${uniqueDays[0]} • ${formatTime(show.schedule[0].time)}`;
  }

  return `${uniqueDays.join(", ")} • ${formatTime(show.schedule[0].time)}`;
};

export default function ShowsPage() {
  const { authenticated, login, twitterObj, user } = useAuth();
  const [selectedShow, setSelectedShow] = useState<ScheduledShow | null>(null);
  const [selectedAnalytics, setSelectedAnalytics] =
    useState<ShowAnalytics | null>(null);
  const [dbShows, setDbShows] = useState<ScheduledShow[]>([]);
  const [hasBookedSelectedShow, setHasBookedSelectedShow] = useState(false);
  const [bookingStatusLoading, setBookingStatusLoading] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const bookingProcessing = bookingActionLoading;
  const bookingDisabled = bookingStatusLoading || bookingActionLoading;

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const shows = await getAllShows();
        setDbShows(shows);
      } catch (e) {
        console.error("Failed to load shows", e);
      }
    };
    fetchShows();
  }, []);

  const handleShowSelect = (show: ScheduledShow) => {
    setSelectedShow(show);
    setSelectedAnalytics(mockAnalytics[show.id!] || null);
    setHasBookedSelectedShow(false);
  };

  const handleBackToList = () => {
    setSelectedShow(null);
    setSelectedAnalytics(null);
    setHasBookedSelectedShow(false);
  };

  useEffect(() => {
    let ignore = false;

    const fetchBookingStatus = async () => {
      if (!selectedShow?.id || !twitterObj?.twitterId) {
        if (!ignore) {
          setHasBookedSelectedShow(false);
        }
        return;
      }

      try {
        setBookingStatusLoading(true);
        const booking = await getShowBooking(
          selectedShow.id,
          String(twitterObj.twitterId)
        );
        if (!ignore) {
          setHasBookedSelectedShow(Boolean(booking));
        }
      } catch (error) {
        console.error("Failed to fetch booking status", error);
      } finally {
        if (!ignore) {
          setBookingStatusLoading(false);
        }
      }
    };

    fetchBookingStatus();

    return () => {
      ignore = true;
    };
  }, [selectedShow?.id, twitterObj?.twitterId]);

  const handleBookTier = async (tierId: string) => {
    if (!selectedShow?.id) {
      console.warn("No show selected for booking");
      return;
    }

    if (!authenticated) {
      try {
        await login();
      } catch (error) {
        console.error("Failed to initiate login before booking", error);
      }
      return;
    }

    if (!twitterObj?.twitterId) {
      console.error("Missing Twitter information for booking");
      return;
    }

    try {
      setBookingActionLoading(true);
      const booking = await createShowBooking({
        show: selectedShow,
        tierLabel: tierId,
        user: {
          uid: user?.uid ?? null,
          twitterId: String(twitterObj.twitterId),
          twitterHandle: twitterObj.username
            ? String(twitterObj.username)
            : null,
          displayName:
            twitterObj.name != null
              ? String(twitterObj.name)
              : user?.displayName ?? null,
        },
      });

      if (booking) {
        setHasBookedSelectedShow(true);
      }
    } catch (error) {
      console.error("Failed to create show booking", error);
    } finally {
      setBookingActionLoading(false);
    }
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
                {[...dbShows].map((show, index) => (
                  <motion.div
                    key={show.id!}
                    className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    // whileHover={{ scale: 1.02, y: -5 }}
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
                          View Show
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
                          <span>{formatSchedule(show)}</span>
                        </div>

                        {/* Participants and Book Button */}
                        <div className="flex items-center justify-between pt-2">
                          {show.participants && show.participants.length > 0 ? (
                            <div className="flex items-center">
                              <div className="flex -space-x-2">
                                {show.participants
                                  .slice(0, 3)
                                  .map((profile: any, index) => {
                                    const src =
                                      typeof profile === "string"
                                        ? profile
                                        : profile.avatarUrl ||
                                          profile.avatar ||
                                          profile.userId ||
                                          "";
                                    return (
                                      <img
                                        key={index}
                                        src={src}
                                        alt={`Participant ${index + 1}`}
                                        className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 object-cover"
                                      />
                                    );
                                  })}
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
                            onClick={() => handleShowSelect(show)}
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
              <ShowDetails
                show={selectedShow}
                analytics={selectedAnalytics}
                onBack={handleBackToList}
                onBookTier={handleBookTier}
                bookingLoading={bookingProcessing}
                bookingDisabled={bookingDisabled}
                isBooked={hasBookedSelectedShow}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
