"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  LeaderboardProjectSnapshot,
  getLbProjectSnapshots,
} from "@/services/db/leaderboardProjects.db";
import { getAudioFiProjectSnapshots } from "@/services/db/audioFi.db";

interface SnapshotChartPoint {
  x: number;
  y: number;
  snapshot: LeaderboardProjectSnapshot;
}

interface SnapshotChartData {
  points: SnapshotChartPoint[];
  linePath: string;
  areaPath: string;
  minCount: number;
  maxCount: number;
}

interface UsersGrowthProps {
  projectId: string;
  startDateInSeconds?: number;
  source?: "leaderboard" | "audioFi";
  setTotalDiscussions?: (discussions: number) => void;
}

export function UsersGrowthChart({
  projectId,
  startDateInSeconds,
  source = "leaderboard",
  setTotalDiscussions,
}: UsersGrowthProps) {
  const {
    data: snapshotData,
    isLoading: snapshotLoading,
    isFetching: snapshotFetching,
  } = useQuery<LeaderboardProjectSnapshot[]>({
    queryKey: ["projectSnapshots", projectId, source],
    queryFn: async (): Promise<LeaderboardProjectSnapshot[]> => {
      if (source === "audioFi") {
        const snaps = await getAudioFiProjectSnapshots(projectId, 50);
        setTotalDiscussions?.(snaps[0].count);
        return snaps.map((s) => ({
          createdAt: s.createdAt,
          usersCount: s.count,
          createdDateTime: new Date(s.createdAt),
          id: `${s.createdAt}`,
        })) as LeaderboardProjectSnapshot[];
      }
      return await getLbProjectSnapshots(projectId, 50);
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    enabled: Boolean(projectId),
  });

  const orderedSnapshots = useMemo(() => {
    if (!snapshotData) {
      return [] as LeaderboardProjectSnapshot[];
    }

    return [...snapshotData].sort((a, b) => a.createdAt - b.createdAt);
  }, [snapshotData]);

  const snapshotChart = useMemo<SnapshotChartData | null>(() => {
    if (!orderedSnapshots.length) {
      return null;
    }

    const counts = orderedSnapshots.map((snap) => snap.usersCount);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const range = maxCount - minCount || 1;
    const baselineY = 95;
    const topPadding = 10;
    const usableHeight = baselineY - topPadding;
    const step =
      orderedSnapshots.length > 1 ? 100 / (orderedSnapshots.length - 1) : 0;

    const points = orderedSnapshots.map((snap, index) => {
      const x =
        orderedSnapshots.length === 1 ? 50 : Number((index * step).toFixed(2));
      const normalized = (snap.usersCount - minCount) / range;
      const y = Number((baselineY - normalized * usableHeight).toFixed(2));
      return { x, y, snapshot: snap } as SnapshotChartPoint;
    });

    const linePath = points
      .map((point, index) => {
        const command = index === 0 ? "M" : "L";
        return `${command} ${point.x} ${point.y}`;
      })
      .join(" ");

    const areaPath = [
      `M ${points[0].x} ${baselineY}`,
      ...points.map((point) => `L ${point.x} ${point.y}`),
      `L ${points[points.length - 1].x} ${baselineY}`,
      "Z",
    ].join(" ");

    return {
      points,
      linePath,
      areaPath,
      minCount,
      maxCount,
    };
  }, [orderedSnapshots]);

  const snapshotsCount = orderedSnapshots.length;
  const latestSnapshot = snapshotsCount
    ? orderedSnapshots[orderedSnapshots.length - 1]
    : null;
  const usersDelta =
    latestSnapshot && snapshotChart?.points?.length
      ? latestSnapshot.usersCount - snapshotChart.points[0].snapshot.usersCount
      : null;

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }),
    []
  );

  const snapshotLabels = useMemo(() => {
    if (!orderedSnapshots.length) {
      return [] as { id: string; label: string }[];
    }

    const labelSlots = Math.min(4, orderedSnapshots.length);

    if (labelSlots === 1) {
      const snapshot = orderedSnapshots[0];
      return [
        {
          id: snapshot.id ?? `${snapshot.createdAt}-0`,
          label: dateFormatter.format(new Date(snapshot.createdAt)),
        },
      ];
    }

    const step = (orderedSnapshots.length - 1) / (labelSlots - 1);

    return Array.from({ length: labelSlots }).map((_, idx) => {
      const snapshot =
        orderedSnapshots[Math.round(idx * step)] ??
        orderedSnapshots[orderedSnapshots.length - 1];
      return {
        id: snapshot.id ?? `${snapshot.createdAt}-${idx}`,
        label: dateFormatter.format(new Date(snapshot.createdAt)),
      };
    });
  }, [orderedSnapshots, dateFormatter]);

  const showRefreshing = snapshotFetching && Boolean(orderedSnapshots.length);
  const isSnapshotLoading = snapshotLoading && !orderedSnapshots.length;
  const firstChartSnapshot = snapshotChart?.points?.[0]?.snapshot ?? null;

  return (
    <div className="mt-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <h3
              className="text-lg font-semibold text-white"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {source === 'audioFi' ? `Discussions Growth` : `Users Growth`}
            </h3>
            <p
              className="text-white/70 text-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {showRefreshing
                ? "Refreshing snapshots..."
                : snapshotsCount
                  ? `Tracking ${Math.min(
                    snapshotsCount,
                    50
                  )} most recent snapshots`
                  : isSnapshotLoading
                    ? "Loading snapshots..."
                    : "No snapshots available yet"}
            </p>

            {showRefreshing && (
              <div
                className="flex items-center gap-2 text-xs text-emerald-300"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Live update
              </div>
            )}
            {!!startDateInSeconds && (
              <div
                className="text-xs text-white/50 mt-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Campaign from{" "}
                {new Date(startDateInSeconds * 1000).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  timeZoneName: "short",
                })}
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <div
              className="text-xs uppercase tracking-wide text-white/60"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {source === 'audioFi' ? `Total Discussions` : `Current users`}
            </div>
            <div
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {latestSnapshot
                ? latestSnapshot.usersCount.toLocaleString()
                : "—"}
            </div>
            <div
              className="text-xs text-white/50"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {latestSnapshot
                ? dateFormatter.format(new Date(latestSnapshot.createdAt))
                : "Awaiting data"}
            </div>
            {usersDelta !== null && (
              <div
                className={`text-sm font-medium ${usersDelta >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {usersDelta >= 0 ? "+" : ""}
                {usersDelta.toLocaleString()} since{" "}
                {firstChartSnapshot
                  ? dateFormatter.format(new Date(firstChartSnapshot.createdAt))
                  : "the first snapshot"}
              </div>
            )}
          </div>
        </div>

        <div className="relative w-full h-56 bg-black/20 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
          {isSnapshotLoading ? (
            <div className="w-full h-full animate-pulse bg-white/5" />
          ) : snapshotChart ? (
            <>
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full text-white"
              >
                <defs>
                  <linearGradient
                    id="usersCountFill"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(129, 140, 248, 0.55)" />
                    <stop offset="100%" stopColor="rgba(129, 140, 248, 0.05)" />
                  </linearGradient>
                </defs>
                <line
                  x1="0"
                  y1="95"
                  x2="100"
                  y2="95"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeDasharray="4 4"
                />
                <path
                  d={snapshotChart.areaPath}
                  fill="url(#usersCountFill)"
                  opacity={0.7}
                />
                <path
                  d={snapshotChart.linePath}
                  fill="none"
                  stroke="rgba(191, 219, 254, 0.9)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {snapshotChart.points.map(({ x, y, snapshot }) => (
                  <circle
                    key={snapshot.id ?? `${snapshot.createdAt}`}
                    cx={x}
                    cy={y}
                    r={1.6}
                    fill="#ffffff"
                    opacity={0.9}
                  >
                    <title>
                      {`${snapshot.usersCount.toLocaleString()} users • ${dateFormatter.format(
                        new Date(snapshot.createdAt)
                      )}`}
                    </title>
                  </circle>
                ))}
              </svg>
              <div
                className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-between text-[11px] text-white/60"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {snapshotLabels.map((item) => (
                  <span key={item.id}>{item.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div
              className="text-white/60 text-sm text-center px-6"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              No snapshot data available
            </div>
          )}
        </div>

        {/* {!!highlightedSnapshots.length && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {highlightedSnapshots.map((snapshot) => (
              <div
                key={snapshot.id ?? `${snapshot.createdAt}-tile`}
                className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div
                  className="text-sm text-white/70"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {dateFormatter.format(new Date(snapshot.createdAt))}
                </div>
                <div
                  className="text-base font-semibold text-white"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {snapshot.usersCount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
}
