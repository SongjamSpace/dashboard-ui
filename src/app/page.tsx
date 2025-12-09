"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart,
  Heart,
  MessageCircle,
  Quote,
  Repeat2,
  Bookmark,
  MessagesSquare,
  RotateCw,
  Star,
  HardHat,
  Trophy,
  CheckSquare,
  Eye,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import Navbar from "@/components/navbar";
import MindshareLeaderboard from "@/components/mindshare-leaderboard";
import { ProjectCard } from "@/components/project-card";
import LoginScreen from "@/components/login-screen";
import {
  LeaderboardProject,
  getAllLbProjectsByTwitterUsername,
} from "@/services/db/leaderboardProjects.db";
import { UsersGrowthChart } from "@/components/users-growth";
import { useRouter } from "next/navigation";

import {
  useDashboardMetrics,
  GrowthView,
  Timeframe,
} from "@/hooks/use-dashboard-metrics";

export interface UndonePointsBreakdown {
  stickers: {
    count: number;
    metadata: { stickers: { id: string; name: string; file_url: string }[] };
  };
  helmet_stickers: {
    count: number;
    metadata: { stickers: { id: string; name: string; file_url: string }[] };
  };
  tasks: { completed: number };
  daily_spins: { count: number };
  watch_orders: { count: number };
  rounds: { completed: number };
}

export interface LeaderboardRow {
  username: string;
  name: string;
  totalPoints: number;
  userId: string;
  stakingMultiplier?: number;
  undonePoints?: number;
  activity?: UndonePointsBreakdown;
}

export interface UndoneData {
  twitter_id: string;
  activity: UndoneActivity;
}

export interface UndoneActivity {
  stickers: {
    count: number;
    metadata: { stickers: { id: string; name: string; file_url: string }[] };
  };
  helmet_stickers: {
    count: number;
    metadata: { stickers: { id: string; name: string; file_url: string }[] };
  };
  tasks: { completed: number };
  daily_spins: { count: number };
  watch_orders: { count: number };
  rounds: { completed: number };
}



export default function Dashboard() {
  const { ready, authenticated, login, twitterObj } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("24H");
  const [growthView, setGrowthView] = useState<GrowthView>("Tweets");
  const router = useRouter();
  const [totalDiscussions, setTotalDiscussions] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<LeaderboardProject | undefined>(undefined);

  // Fetch all projects data from Firebase
  const {
    data: projects,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery<LeaderboardProject[], Error>({
    queryKey: ["projects", twitterObj?.username || ""],
    queryFn: async (): Promise<LeaderboardProject[]> => {
      if (!twitterObj?.username) {
        return [];
      }
      const allProjects = await getAllLbProjectsByTwitterUsername(twitterObj.username);
      // Set first project as default
      if (allProjects.length > 0 && !selectedProject) {
        setSelectedProject(allProjects[0]);
      }
      return allProjects;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: authenticated, // Only fetch when user is authenticated
  });

  const baseServerUrl = process.env.NEXT_PUBLIC_SONGJAM_SERVER;

  // Analytics data fetch using custom hook
  const { cards, isLoading: analyticsLoading } = useDashboardMetrics(
    growthView,
    selectedProject,
    twitterObj?.username,
    selectedTimeframe
  );

  // Fetch leaderboard data (using existing endpoint)
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    isFetching: leaderboardFetching,
    error: leaderboardError,
  } = useQuery<LeaderboardRow[], Error>({
    queryKey: ["leaderboard", selectedProject?.projectId || ""],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const response = await fetch(
        `https://songjamspace-leaderboard.logesh-063.workers.dev/${selectedProject?.projectId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = (await response.json()) as LeaderboardRow[];
      return result;
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    enabled: Boolean(selectedProject?.projectId),
  });

  // Fetch Undone Watches data when projectId is "undonewatches"
  const {
    data: undoneData,
    isLoading: undoneLoading,
    error: undoneError,
  } = useQuery<UndoneData[], Error>({
    queryKey: ["undone", selectedProject?.projectId || ""],
    queryFn: async (): Promise<UndoneData[]> => {
      const response = await axios.get<UndoneData[]>(
        "https://undone-wf1-1.dkloud.io/get_leaderboard",
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_UNDONE_API_KEY}`,
          },
        }
      );
      return response.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: Boolean(selectedProject?.projectId === "undonewatches"),
  });

  // Calculate Undone Metrics
  const undoneMetrics = undoneData?.reduce(
    (acc, curr) => {
      const activity = curr.activity;
      if (!activity) return acc;
      return {
        totalDailySpins: acc.totalDailySpins + (activity.daily_spins?.count || 0),
        totalStickers: acc.totalStickers + (activity.stickers?.count || 0),
        totalHelmetStickers:
          acc.totalHelmetStickers + (activity.helmet_stickers?.count || 0),
        totalRoundsCompleted:
          acc.totalRoundsCompleted + (activity.rounds?.completed || 0),
        totalTasksCompleted:
          acc.totalTasksCompleted + (activity.tasks?.completed || 0),
        totalWatchOrders:
          acc.totalWatchOrders + (activity.watch_orders?.count || 0),
      };
    },
    {
      totalDailySpins: 0,
      totalStickers: 0,
      totalHelmetStickers: 0,
      totalRoundsCompleted: 0,
      totalTasksCompleted: 0,
      totalWatchOrders: 0,
    }
  );

  const displayCards =
    growthView === "Undone"
      ? [
        {
          key: "totalDailySpins",
          label: "Daily Spins",
          value: undoneMetrics?.totalDailySpins || 0,
          icon: RotateCw,
        },
        {
          key: "totalStickers",
          label: "Stickers",
          value: undoneMetrics?.totalStickers || 0,
          icon: Star,
        },
        {
          key: "totalHelmetStickers",
          label: "Helmet Stickers",
          value: undoneMetrics?.totalHelmetStickers || 0,
          icon: HardHat,
        },
        {
          key: "totalRoundsCompleted",
          label: "Rounds Completed",
          value: undoneMetrics?.totalRoundsCompleted || 0,
          icon: Trophy,
        },
        {
          key: "totalTasksCompleted",
          label: "Tasks Completed",
          value: undoneMetrics?.totalTasksCompleted || 0,
          icon: CheckSquare,
        },
        {
          key: "totalWatchOrders",
          label: "Watch Orders",
          value: undoneMetrics?.totalWatchOrders || 0,
          icon: Eye,
        },
      ]
      : growthView === "Spaces"
        ? [
          ...cards,
          {
            key: "totalDiscussions",
            label: "Discussions",
            value: totalDiscussions,
            icon: MessagesSquare,
          },
        ]
        : cards;

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login screen when user is not authenticated
  if (!authenticated) {
    return <LoginScreen login={login} />;
  }

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
          Dealflow Dashboard
        </motion.h1>
        <motion.p
          className="text-xl max-w-4xl mx-auto drop-shadow-lg text-white/90"
          style={{ fontFamily: "Inter, sans-serif" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Schedule a show, a shoutout, a season or more
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Project Card */}
          <div className="mb-8">
            {projectLoading ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/20 rounded w-32"></div>
                      <div className="h-3 bg-white/20 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-white/20 rounded w-40"></div>
                    <div className="h-3 bg-white/20 rounded w-36"></div>
                    <div className="h-3 bg-white/20 rounded w-44"></div>
                  </div>
                </div>
              </div>
            ) : selectedProject ? (
              <ProjectCard
                project={selectedProject}
                projects={projects}
                onProjectUpdate={(updatedProject) => {
                  console.log("Project updated:", updatedProject);
                  // Here you would typically save the updated project to your backend
                }}
                onProjectSelect={(project) => {
                  setSelectedProject(project);
                }}
              />
            ) : (
              <div className="bg-yellow-500/10 backdrop-blur-sm rounded-xl border border-yellow-500/20 p-6">
                <div className="text-yellow-400 text-center">
                  <p style={{ fontFamily: "Inter, sans-serif" }}>
                    No project found for your account {twitterObj?.username}
                  </p>
                  <p
                    className="text-sm text-yellow-400/70 mt-2"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Reach out to us to create a Leaderboard
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Section with Timeframe Selector */}
          <div className="mb-8">
            {/* Timeframe Selector - Aligned to the right */}
            <div className="flex justify-end mb-6">
              {selectedProject?.enableLurkySpacePoints && (
                <div className="flex rounded-lg p-1 border bg-white/10 border-white/20">
                  {([
                    "Tweets",
                    "Spaces",
                    ...(selectedProject?.projectId === "undonewatches"
                      ? ["Undone"]
                      : []),
                  ] as GrowthView[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => setGrowthView(view)}
                      className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${growthView === view
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/70 hover:text-white/90"
                        }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {displayCards.map((metric) => {
                const IconComponent = metric.icon;
                return (
                  <motion.div
                    key={metric.key}
                    className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="flex justify-center mb-2">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div
                      className="text-3xl font-bold text-white mb-1"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {metric.value.toLocaleString()}
                    </div>
                    <div
                      className="text-white/70 text-sm"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {metric.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {selectedProject?.projectId && growthView !== "Undone" && (
              <UsersGrowthChart
                projectId={
                  selectedProject?.projectId
                }
                startDateInSeconds={selectedProject?.startDateInSeconds}
                source={growthView === "Spaces" ? "audioFi" : "leaderboard"}
                setTotalDiscussions={setTotalDiscussions}
              />
            )}
          </div>

          {/* Last Updated */}
          {/* {analyticsData && (
            <div className="text-center mb-8">
              <div
                className="text-white/60 text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Last updated: {formatLastUpdated(analyticsData.lastUpdated)}
              </div>
            </div>
          )} */}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Yappers Table - Takes 3 columns */}
            <div className="lg:col-span-3">
              <MindshareLeaderboard
                leaderboardData={leaderboardData}
                projectId={selectedProject?.projectId}
              />
            </div>

            {/* Marketing Sidebar - Takes 1 column */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Request KOL Shows */}
                <motion.div
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-purple-400/30 p-6 text-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="text-3xl mb-3">🎤</div>
                  <h4
                    className="text-lg font-bold text-white mb-2"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    X Space Shows
                  </h4>
                  <p
                    className="text-white/80 text-sm mb-4"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Book a show to promote your brand
                  </p>
                  <motion.button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/shows")}
                  >
                    Check Now
                  </motion.button>
                </motion.div>

                {/* Blast Auto DMs */}
                <motion.div
                  className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl border border-blue-400/30 p-6 text-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="text-3xl mb-3">📨</div>
                  <h4
                    className="text-lg font-bold text-white mb-2"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    Blast Auto DMs
                  </h4>
                  <p
                    className="text-white/80 text-sm mb-4"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Send automated messages to your target audience
                  </p>
                  <motion.button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      window.open(
                        "https://app.songjam.space/auto-dms",
                        "_blank"
                      )
                    }
                  >
                    Setup Campaign
                  </motion.button>
                </motion.div>

                {/* Transcribe Space */}
                <motion.div
                  className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl border border-green-400/30 p-6 text-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="text-3xl mb-3">📝</div>
                  <h4
                    className="text-lg font-bold text-white mb-2"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    Transcribe Space
                  </h4>
                  <p
                    className="text-white/80 text-sm mb-4"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Convert your Spaces into written content
                  </p>
                  <motion.button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      window.open(
                        "https://app.songjam.space/dashboard",
                        "_blank"
                      )
                    }
                  >
                    Start Transcription
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
