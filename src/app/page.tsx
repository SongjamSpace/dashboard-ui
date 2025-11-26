"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import {
  BarChart,
  Heart,
  MessageCircle,
  Quote,
  Repeat2,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import Navbar from "@/components/navbar";
import { ProjectCard } from "@/components/project-card";
import LoginScreen from "@/components/login-screen";
import {
  LeaderboardProject,
  getLbProjectByTwitterUsername,
} from "@/services/db/leaderboardProjects.db";
import { UsersGrowthChart } from "@/components/users-growth";
import { useRouter } from "next/navigation";

interface AnalyticsMetrics {
  projectId: string;
  totalLikes: number;
  totalReplies: number;
  totalRetweets: number;
  totalQuotes: number;
  totalBookmarks: number;
  totalViews?: number;
}

interface AnalyticsResponse {
  success: boolean;
  metrics: AnalyticsMetrics;
}

interface LeaderboardRow {
  username: string;
  name: string;
  totalPoints: number;
  userId: string;
  stakingMultiplier?: number;
}

type Timeframe = "24H" | "ALL";

export default function Dashboard() {
  const { ready, authenticated, login, twitterObj } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("24H");
  const router = useRouter();
  // Fetch project data from Firebase
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery<LeaderboardProject | undefined, Error>({
    queryKey: ["project", twitterObj?.username || ""],
    queryFn: async (): Promise<LeaderboardProject | undefined> => {
      if (!twitterObj?.username) {
        return undefined;
      }
      return await getLbProjectByTwitterUsername(twitterObj?.username);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: authenticated, // Only fetch when user is authenticated
  });

  const baseServerUrl = process.env.NEXT_PUBLIC_SONGJAM_SERVER;

  // Analytics data fetch
  const { data: analyticsData, isLoading: analyticsLoading } =
    useQuery<AnalyticsMetrics>({
      queryKey: ["analytics", project?.projectId, selectedTimeframe],
      queryFn: async (): Promise<AnalyticsMetrics> => {
        if (!project?.projectId) {
          throw new Error("Missing projectId for analytics data request");
        }

        if (!baseServerUrl) {
          throw new Error(
            "NEXT_PUBLIC_SONGJAM_SERVER environment variable is not configured"
          );
        }

        const analyticsUrl = new URL("/leaderboard/metrics", baseServerUrl);
        analyticsUrl.searchParams.set("projectId", project.projectId);
        analyticsUrl.searchParams.set("timeframe", selectedTimeframe);

        const response = await fetch(analyticsUrl.toString());

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as AnalyticsResponse;

        if (!result.success) {
          throw new Error("Analytics request did not succeed");
        }

        return result.metrics;
      },
      staleTime: 60 * 1000,
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: false,
      enabled: Boolean(project?.projectId),
    });

  // Fetch leaderboard data (using existing endpoint)
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    isFetching: leaderboardFetching,
    error: leaderboardError,
  } = useQuery<LeaderboardRow[], Error>({
    queryKey: ["leaderboard", project?.projectId || ""],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const response = await fetch(
        `https://songjamspace-leaderboard.logesh-063.workers.dev/${project?.projectId}`
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
    enabled: Boolean(project?.projectId),
  });

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
            ) : project ? (
              <ProjectCard
                project={project}
                onProjectUpdate={(updatedProject) => {
                  console.log("Project updated:", updatedProject);
                  // Here you would typically save the updated project to your backend
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
              {/* <div className="flex rounded-lg p-1 border bg-white/10 border-white/20">
                {(["24H", "ALL"] as Timeframe[]).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => handleTimeframeChange(timeframe)}
                    className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                      selectedTimeframe === timeframe
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/70 hover:text-white/90"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {timeframe}
                  </button>
                ))}
              </div> */}
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {analyticsData &&
                [
                  {
                    key: "totalViews" as const,
                    label: "Views",
                    icon: BarChart,
                    fallback: 0,
                  },
                  {
                    key: "totalLikes" as const,
                    label: "Likes",
                    icon: Heart,
                    fallback: 0,
                  },
                  {
                    key: "totalReplies" as const,
                    label: "Replies",
                    icon: MessageCircle,
                    fallback: 0,
                  },
                  {
                    key: "totalQuotes" as const,
                    label: "Quotes",
                    icon: Quote,
                    fallback: 0,
                  },
                  {
                    key: "totalRetweets" as const,
                    label: "Retweets",
                    icon: Repeat2,
                    fallback: 0,
                  },
                  {
                    key: "totalBookmarks" as const,
                    label: "Bookmarks",
                    icon: Bookmark,
                    fallback: 0,
                  },
                ].map((metric) => {
                  const IconComponent = metric.icon;
                  const value =
                    analyticsData[metric.key] ?? metric.fallback ?? 0;
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
                        {value.toLocaleString()}
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

            {project?.projectId && (
              <UsersGrowthChart
                projectId={project.projectId}
                startDateInSeconds={project.startDateInSeconds}
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
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold text-white"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    All Singers
                  </h3>
                  <div className="flex items-center space-x-2">
                    {/* <div className="text-2xl">👥</div> */}
                    <div
                      className="text-xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-4"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {leaderboardData?.length || 0}
                    </div>
                    {/* <div
                      className="text-xs text-white/60 font-medium"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      singers
                    </div> */}
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[40rem] overflow-y-auto">
                  <table className="min-w-full">
                    <thead className="sticky top-0 z-10 bg-black/60 border-b border-white/10 shadow-sm">
                      <tr
                        className="text-left text-white/70 text-sm"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <th className="px-6 py-3">Rank</th>
                        <th className="px-6 py-3">Yapper</th>
                        <th className="px-6 py-3 text-center">
                          Staking Multiplier
                        </th>
                        <th className="px-6 py-3 text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData?.map((u, idx) => (
                        <tr
                          key={u.userId}
                          className={`${idx % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"
                            } border-t border-white/10`}
                        >
                          <td className="px-6 py-3 align-middle">
                            <span
                              className="text-white font-medium"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-6 py-3 align-middle">
                            <div className="flex flex-col">
                              <span
                                className="text-white font-medium"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                {u.name || u.username}
                              </span>
                              <span
                                className="text-white/60 text-sm"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                @{u.username}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center align-middle">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-sm shadow-sm ${u.stakingMultiplier && u.stakingMultiplier > 1
                                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white"
                                : "bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 text-white/70"
                                }`}
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {u.stakingMultiplier
                                ? u.stakingMultiplier.toFixed(2) + "x"
                                : "1x"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right align-middle">
                            <span
                              className="text-white font-medium"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {u.totalPoints.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
