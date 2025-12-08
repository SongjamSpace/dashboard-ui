"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useAuth } from "@/components/providers";
import { createMindsharePreview, getMindsharePreviewByUid, MindsharePreview } from "@/services/db/mindsharePreviews.db";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase.service";
import { useEffect } from "react";
import {
    Eye,
    Heart,
    MessageCircle,
    Quote,
    RotateCcw,
    Bookmark,
    Calendar,
    Search,
} from "lucide-react";

export default function MindsharePreviewPage() {
    const router = useRouter();
    const { twitterObj, authenticated, login } = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [startDate, setStartDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<MindsharePreview | null>(null);
    const [pendingSubmit, setPendingSubmit] = useState(false);

    useEffect(() => {
        const checkExistingPreview = async () => {
            if (authenticated && twitterObj?.twitterId) {
                const existingId = await getMindsharePreviewByUid(twitterObj.twitterId);
                if (existingId) {
                    setPreviewId(existingId);
                    setShowPreview(true);
                }
            }
        };
        checkExistingPreview();
    }, [authenticated, twitterObj]);

    useEffect(() => {
        if (authenticated && pendingSubmit) {
            setPendingSubmit(false);
            handleSubmit(new Event('submit') as any);
        }
    }, [authenticated, pendingSubmit]);

    useEffect(() => {
        if (!previewId) return;

        const unsubscribe = onSnapshot(doc(db, "mindshare_previews", previewId), (doc) => {
            if (doc.exists()) {
                const data = doc.data() as MindsharePreview;
                setPreviewData(data);
            }
        });

        return () => unsubscribe();
    }, [previewId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !startDate) return;

        if (!authenticated) {
            setPendingSubmit(true);
            await login();
            return;
        }

        setIsLoading(true);

        try {
            const isCashtag = identifier.startsWith("$");
            const cleanIdentifier = identifier.replace(/^[@$]/, "");

            const startDateObj = new Date(startDate);
            const startDateInSeconds = Math.floor(startDateObj.getTime() / 1000);

            const id = await createMindsharePreview({
                cashtag: isCashtag ? cleanIdentifier : "",
                twitterUsername: !isCashtag ? cleanIdentifier : "",
                startFrom: startDate,
                startDateInSeconds,
                status: "NEW",
                user: {
                    username: twitterObj?.username || "",
                    name: twitterObj?.name || "",
                    uid: twitterObj?.twitterId || "",
                },
            });

            setPreviewId(id);
            setShowPreview(true);
        } catch (error) {
            console.error("Error creating preview:", error);
            // Handle error (maybe show a toast)
        } finally {
            setIsLoading(false);
        }
    };

    if (showPreview) {
        // PROCESSING STATE
        if (!previewData || previewData.status === "NEW" || previewData.status === "PROCESSING") {
            return (
                <div className="min-h-screen bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)] flex flex-col items-center justify-center p-4">
                    <div className="relative z-20 w-full max-w-4xl">
                        <Navbar />
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8 relative"
                        >
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse"></div>
                            <div className="relative z-10 w-32 h-32 flex items-center justify-center">
                                <svg className="animate-spin w-full h-full text-purple-500" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Search className="w-12 h-12 text-white/80" />
                                </div>
                            </div>
                        </motion.div>

                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
                            Preparing Mindshare
                        </h2>
                        <p className="text-xl text-white/60 mb-8" style={{ fontFamily: "Inter, sans-serif" }}>
                            Analyzing social footprint for <span className="text-purple-400 font-bold">{identifier}</span>...
                        </p>

                        <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                        <p className="text-sm text-white/40 animate-pulse">
                            Measuring influence • Analyzing sentiment • Generating Mindshare Report
                        </p>
                    </div>
                </div>
            );
        }

        // ENDED STATE - SHOW DASHBOARD
        return (
            <div className="min-h-screen bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)]">
                <div className="relative z-20 px-4 py-4">
                    <Navbar />
                </div>

                {/* Preview Header */}
                <div className="relative z-10 text-center py-8 px-4 bg-green-500/10 border-y border-green-500/20 mb-8">
                    <h2 className="text-2xl font-bold text-green-400 mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                        MINDSHARE REPORT READY
                    </h2>
                    <p className="text-green-200/80" style={{ fontFamily: "Inter, sans-serif" }}>
                        Mindshare analysis for <span className="font-bold text-white">{identifier}</span> from {startDate}
                    </p>
                </div>

                {/* Dashboard Content */}
                <div className="relative z-10 px-4 pb-8">
                    <div className="max-w-7xl mx-auto">

                        {/* Project Card */}
                        <div className="mb-8">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                                        {identifier.charAt(1).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                                            {identifier}
                                        </h3>
                                        <div className="flex items-center space-x-2 text-white/60">
                                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-500/30">
                                                Active
                                            </span>
                                            <span className="text-sm">Tracking Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analytics Cards - Populated with dummy data for now as requested "Show Dashboard" */}
                        {/* In a real scenario, we would use previewData metrics if available */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
                            {[
                                { label: "Views", icon: Eye, value: "12.5K" },
                                { label: "Likes", icon: Heart, value: "1.2K" },
                                { label: "Replies", icon: MessageCircle, value: "342" },
                                { label: "Quotes", icon: Quote, value: "89" },
                                { label: "Retweets", icon: RotateCcw, value: "456" },
                                { label: "Bookmarks", icon: Bookmark, value: "230" },
                            ].map((metric, idx) => (
                                <motion.div
                                    key={idx}
                                    className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 text-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                >
                                    <div className="flex justify-center mb-2">
                                        <metric.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Orbitron, sans-serif" }}>
                                        {metric.value}
                                    </div>
                                    <div className="text-white/70 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                                        {metric.label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Placeholder for Chart/Table */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-12 text-center">
                            <div className="text-4xl mb-4">�</div>
                            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                                Growth Trajectory
                            </h3>
                            <p className="text-white/60 max-w-md mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                                Detailed growth analytics will appear here once enough data points are collected.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[oklch(0.145_0_0)] via-[oklch(0.165_0_0)] to-[oklch(0.125_0_0)] flex flex-col">
            <div className="relative z-20 px-4 py-4">
                <Navbar />
            </div>

            <div className="flex-1 flex items-center justify-center px-4 relative z-10">
                <motion.div
                    className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                            Mindshare Preview
                        </h1>
                        <p className="text-white/70" style={{ fontFamily: "Inter, sans-serif" }}>
                            Enter a target to calculate their Mindshare
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                                Target Identifier
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-white/40" />
                                </div>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="@username or $cashtag"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                                Start Date
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-white/40" />
                                </div>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all [color-scheme:dark]"
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                "Prepare Leaderboard"
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
