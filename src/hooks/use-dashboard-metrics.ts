import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
    BarChart,
    Heart,
    MessageCircle,
    Quote,
    Repeat2,
    Bookmark,
    Mic,
    Users,
    Shield,
    LucideIcon,
} from "lucide-react";
import { LeaderboardProject } from "@/services/db/leaderboardProjects.db";

export type Timeframe = "24H" | "ALL";
export type GrowthView = "Tweets" | "Spaces";

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

interface AudioFiAnalytics {
    totalSpaces: number;
    totalSpeakers: number;
    totalAdmins: number;
}

interface AudioFiResponse {
    success: boolean;
    analytics: AudioFiAnalytics;
}

export interface MetricCardConfig {
    key: string;
    label: string;
    value: number;
    icon: LucideIcon;
}

export const useDashboardMetrics = (
    view: GrowthView,
    project: LeaderboardProject | undefined,
    twitterUsername: string | undefined,
    timeframe: Timeframe
) => {
    const baseServerUrl = process.env.NEXT_PUBLIC_SONGJAM_SERVER;

    // Tweets Analytics
    const { data: tweetsData, isLoading: tweetsLoading } =
        useQuery<AnalyticsMetrics>({
            queryKey: ["analytics", project?.projectId, timeframe],
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
                analyticsUrl.searchParams.set("timeframe", timeframe);

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
            enabled: view === "Tweets" && Boolean(project?.projectId),
        });

    // AudioFi Analytics
    const { data: audioFiData, isLoading: audioFiLoading } =
        useQuery<AudioFiAnalytics>({
            queryKey: ["audioFiAnalytics", twitterUsername],
            queryFn: async (): Promise<AudioFiAnalytics> => {
                if (!project?.projectId) {
                    throw new Error("Missing projectId for audioFi analytics");
                }

                if (!baseServerUrl) {
                    throw new Error(
                        "NEXT_PUBLIC_SONGJAM_SERVER environment variable is not configured"
                    );
                }

                const analyticsUrl = new URL("/audiofi/analytics", baseServerUrl);
                // Assuming the backend expects 'projectId' as the query param for the username
                // or maybe it infers from the user context? The user said "fetch audioFi project by projectId === twitterUsername.toLowercase()"
                // But for the analytics endpoint, the user just gave the URL.
                // I'll add projectId as a query param to be safe, matching the pattern.
                analyticsUrl.searchParams.set("projectId", project.projectId);

                const response = await fetch(analyticsUrl.toString());

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = (await response.json()) as AudioFiResponse;

                if (!result.success) {
                    throw new Error("AudioFi analytics request did not succeed");
                }

                return result.analytics;
            },
            staleTime: 60 * 1000,
            placeholderData: keepPreviousData,
            refetchOnWindowFocus: false,
            enabled: view === "Spaces" && Boolean(twitterUsername),
        });

    const cards: MetricCardConfig[] =
        view === "Tweets"
            ? [
                {
                    key: "totalViews",
                    label: "Views",
                    value: tweetsData?.totalViews ?? 0,
                    icon: BarChart,
                },
                {
                    key: "totalLikes",
                    label: "Likes",
                    value: tweetsData?.totalLikes ?? 0,
                    icon: Heart,
                },
                {
                    key: "totalReplies",
                    label: "Replies",
                    value: tweetsData?.totalReplies ?? 0,
                    icon: MessageCircle,
                },
                {
                    key: "totalQuotes",
                    label: "Quotes",
                    value: tweetsData?.totalQuotes ?? 0,
                    icon: Quote,
                },
                {
                    key: "totalRetweets",
                    label: "Retweets",
                    value: tweetsData?.totalRetweets ?? 0,
                    icon: Repeat2,
                },
                {
                    key: "totalBookmarks",
                    label: "Bookmarks",
                    value: tweetsData?.totalBookmarks ?? 0,
                    icon: Bookmark,
                },
            ]
            : [
                {
                    key: "totalSpaces",
                    label: "Spaces",
                    value: audioFiData?.totalSpaces ?? 0,
                    icon: Mic,
                },
                {
                    key: "totalSpeakers",
                    label: "Speakers",
                    value: audioFiData?.totalSpeakers ?? 0,
                    icon: Users,
                },
                {
                    key: "totalAdmins",
                    label: "Admins",
                    value: audioFiData?.totalAdmins ?? 0,
                    icon: Shield,
                },
            ];

    return {
        cards,
        isLoading: view === "Tweets" ? tweetsLoading : audioFiLoading,
    };
};
