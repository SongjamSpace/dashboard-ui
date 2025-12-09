import React, { useState } from "react";
import type { LeaderboardRow, UndonePointsBreakdown } from "@/app/page"; // Adjust import if needed
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface MindshareLeaderboardProps {
    leaderboardData?: LeaderboardRow[];
    projectId?: string;
}

// Calculate points from breakdown
const calculatePointsFromBreakdown = (
    breakdown: UndonePointsBreakdown | undefined
): number => {
    if (!breakdown) return 0;

    const pointsMap: Record<string, number> = {
        daily_spins: 5,
        stickers: 20,
        helmet_stickers: 50,
        tasks: 100,
        rounds: 200,
        watch_orders: 0, // This is a multiplier, not points
    };

    let total = 0;

    // Handle daily_spins
    if (breakdown.daily_spins?.count) {
        total += breakdown.daily_spins.count * pointsMap.daily_spins;
    }

    // Handle stickers
    if (breakdown.stickers?.count) {
        total += breakdown.stickers.count * pointsMap.stickers;
    }

    // Handle helmet_stickers
    if (breakdown.helmet_stickers?.count) {
        total += breakdown.helmet_stickers.count * pointsMap.helmet_stickers;
    }

    // Handle tasks
    if (breakdown.tasks?.completed) {
        total += breakdown.tasks.completed * pointsMap.tasks;
    }

    // Handle rounds
    if (breakdown.rounds?.completed) {
        total += breakdown.rounds.completed * pointsMap.rounds;
    }

    // Apply watch_orders multiplier (x2 if count > 0)
    const multiplier =
        breakdown.watch_orders && breakdown.watch_orders.count > 0 ? 2 : 1;

    return total * multiplier;
};

const MindshareLeaderboard: React.FC<MindshareLeaderboardProps> = ({ leaderboardData, projectId }) => {
    const [expandedUndoneRow, setExpandedUndoneRow] = useState<string | null>(
        null
    );

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                    All Singers
                </h3>
                <div className="flex items-center space-x-2">
                    <div
                        className="text-xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-4"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                        {leaderboardData?.length || 0}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto max-h-[40rem] overflow-y-auto">
                <table className="min-w-full">
                    <thead className="sticky top-0 z-10 bg-black/60 border-b border-white/10 shadow-sm">
                        <tr className="text-left text-white/70 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                            <th className="px-6 py-3">Rank</th>
                            <th className="px-6 py-3">Singer</th>
                            <th className="px-6 py-3 text-center">Staking Multiplier</th>
                            {projectId === "undonewatches" && (
                                <th className="px-6 py-3 text-center">Undone Points</th>
                            )}
                            <th className="px-6 py-3 text-right">Total Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData?.map((u, idx) => (
                            <React.Fragment key={u.userId}>
                                <tr
                                    key={u.userId}
                                    className={`${idx % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"} border-t border-white/10`}
                                >
                                    <td className="px-6 py-3 align-middle">
                                        <span className="text-white font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                                                {u.name || u.username}
                                            </span>
                                            <span className="text-white/60 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
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
                                            {u.stakingMultiplier ? u.stakingMultiplier.toFixed(2) + "x" : "1x"}
                                        </span>
                                    </td>
                                    {projectId === "undonewatches" && (
                                        <td className="px-2 py-2 text-right align-middle">
                                            {!u.undonePoints ? (
                                                <div className="inline-flex items-center justify-center px-2 md:px-3 py-1 md:py-1.5 rounded text-red-400/80 group relative">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-black/95 text-white text-xs rounded-lg p-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-auto z-50 shadow-2xl border border-white/30 whitespace-normal">
                                                        <a
                                                            href="https://bit.ly/unWF1"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-white/90 text-center hover:text-white block"
                                                        >
                                                            Play the{" "}
                                                            <span className="underline">
                                                                Undone game
                                                            </span>{" "}
                                                            to qualify
                                                        </a>
                                                        <div className="absolute top-full right-4 -mt-1 border-[6px] border-transparent border-t-black/95"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        setExpandedUndoneRow(
                                                            expandedUndoneRow === u.userId
                                                                ? null
                                                                : u.userId
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center px-2 md:px-3 py-1 md:py-1.5 rounded text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                                                    style={{ fontFamily: "Inter, sans-serif" }}
                                                    title="View points breakdown"
                                                >
                                                    <span className="text-xs md:text-sm font-medium">
                                                        {u.undonePoints !== undefined
                                                            ? u.undonePoints.toFixed(2)
                                                            : u.activity
                                                                ? calculatePointsFromBreakdown(
                                                                    u.activity
                                                                ).toFixed(2)
                                                                : ""}
                                                    </span>
                                                    <svg
                                                        className={`ml-1.5 w-3 h-3 transition-transform duration-200 ${expandedUndoneRow === u.userId
                                                            ? "rotate-180"
                                                            : ""
                                                            }`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2.5}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-3 text-right align-middle">
                                        <span className="text-white font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                                            {u.totalPoints.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                                {/* Expanded row for Undone Points breakdown */}
                                {projectId === "undonewatches" && <AnimatePresence>
                                    {expandedUndoneRow === u.userId && (
                                        <tr className="bg-white/[0.08] border-t border-white/20">
                                            <td
                                                colSpan={5}
                                                className="px-2 md:px-6 py-0"
                                            >
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="py-4">
                                                        {u.activity ? (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 md:gap-2">
                                                                {u.activity.daily_spins && (
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-white/60 text-[10px] leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            Daily Spins
                                                                        </div>
                                                                        <div
                                                                            className="text-white font-medium text-xs leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            {u.activity.daily_spins.count * 5}{" "}
                                                                            pts
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {u.activity.stickers && (
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-white/60 text-[10px] leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            Stickers
                                                                        </div>
                                                                        <div
                                                                            className="text-white font-medium text-xs leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            {u.activity.stickers.count * 20}{" "}
                                                                            pts
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {u.activity.helmet_stickers && (
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-white/60 text-[10px] leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            Helmet
                                                                        </div>
                                                                        <div
                                                                            className="text-white font-medium text-xs leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            {u.activity.helmet_stickers
                                                                                .count * 50}{" "}
                                                                            pts
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {u.activity.tasks && (
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-white/60 text-[10px] leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            Tasks
                                                                        </div>
                                                                        <div
                                                                            className="text-white font-medium text-xs leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            {u.activity.tasks.completed * 100}{" "}
                                                                            pts
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {u.activity.rounds && (
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-white/60 text-[10px] leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            Rounds
                                                                        </div>
                                                                        <div
                                                                            className="text-white font-medium text-xs leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            {u.activity.rounds.completed *
                                                                                200}{" "}
                                                                            pts
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {u.activity.watch_orders && (
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-white/60 text-[10px] leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            Watch
                                                                        </div>
                                                                        <div
                                                                            className="text-white font-medium text-xs leading-tight"
                                                                            style={{
                                                                                fontFamily: "Inter, sans-serif",
                                                                            }}
                                                                        >
                                                                            {u.activity.watch_orders.count > 0
                                                                                ? "x2"
                                                                                : "-"}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MindshareLeaderboard;
