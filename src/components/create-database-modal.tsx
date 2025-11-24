"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Database,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    User,
    MessageSquare,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { getSnapListenerById, SnapJob } from "@/services/db/snaps.service";

interface CreateDatabaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Placeholder types for results
interface MongoTweet {
    id: string;
    text: string;
    user: {
        name: string;
        username: string;
        profile_image_url: string;
    };
}

interface Profile {
    userId: string;
    username: string;
    name: string;
    description: string;
    profileImageUrl: string;
}

export default function CreateDatabaseModal({
    isOpen,
    onClose,
}: CreateDatabaseModalProps) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchProgress, setSearchProgress] = useState(0);
    const [searchMessage, setSearchMessage] = useState("");
    const [searchResults, setSearchResults] = useState<(MongoTweet | Profile)[]>(
        []
    );
    const [showResults, setShowResults] = useState(false);

    // Job monitoring state
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [currentJob, setCurrentJob] = useState<SnapJob | null>(null);
    const [maxCount, setMaxCount] = useState(100);
    const [isFetchingTweets, setIsFetchingTweets] = useState(false);
    const [searchType, setSearchType] = useState<"PROFILES" | "TWEETS">("PROFILES");
    const [messageStatus, setMessageStatus] = useState<
        "CREATED" | "PROCESSING" | "COMPLETED" | "FAILED"
    >("CREATED");

    // Job monitoring with Firebase real-time listener
    useEffect(() => {
        if (!currentJobId) return;

        const unsubscribe = getSnapListenerById(currentJobId, (snap) => {
            if (!snap) {
                console.error("Job document not found");
                setSearchMessage("Job not found");
                setIsSearching(false);
                return;
            }
            setCurrentJob(snap);
            if (snap.searchQuery) {
                setSearchQuery(snap.searchQuery);
            }

            // Update progress and message based on job status
            if (snap.status === "PROCESSING") {
                setMessageStatus("PROCESSING");
                setSearchMessage(
                    `Processing... Found ${snap.tweetsCount || 0} tweets and ${snap.profilesCount || 0
                    } profiles`
                );
                // Estimate progress
                setSearchProgress(
                    Math.min(((snap.tweetsCount || 0) / maxCount) * 100, 90)
                );
            } else if (snap.status === "COMPLETED") {
                setMessageStatus("COMPLETED");
                setSearchProgress(100);
                setSearchMessage(
                    `Completed! Found ${snap.tweetsCount || 0} tweets and ${snap.profilesCount || 0
                    } profiles`
                );
                setIsSearching(false);
                setShowResults(true);

                // Fetch the actual tweets/profiles
                fetchSampleTweets(currentJobId);
            } else if (snap.status === "FAILED") {
                setMessageStatus("FAILED");
                console.log(`Failed: ${snap.error || "Unknown error"}`);
                setSearchMessage(
                    `Failed to create database. Please try again later.`
                );
                setIsSearching(false);
            }
        });

        return () => unsubscribe();
    }, [currentJobId, maxCount]);

    const fetchSampleTweets = async (jobId: string) => {
        const token = await user?.getIdToken();
        if (!token) {
            alert("No token found");
            return;
        }
        setIsFetchingTweets(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SONGJAM_SERVER}/snaps/samples/${jobId}?searchType=${searchType}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (data.samples) {
                setSearchResults(data.samples);
            }
        } catch (error) {
            console.error("Error fetching sample tweets:", error);
        } finally {
            setIsFetchingTweets(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            return;
        }

        const token = await user?.getIdToken();
        if (!token) {
            alert("No token found");
            return;
        }

        setIsSearching(true);
        setSearchProgress(0);
        setSearchMessage("Initializing search...");
        setShowResults(false);
        setCurrentJobId(null);
        setCurrentJob(null);
        setSearchResults([]);

        try {
            // Start the scraping process
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SONGJAM_SERVER}/snaps/process`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        searchQuery,
                        searchType,
                        maxCount,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                const { snapId } = data;
                setCurrentJobId(snapId);
                setSearchMessage("Process started...");
            } else {
                throw new Error(data.message || "Failed to start scraping process");
            }
        } catch (error) {
            console.error("Search error:", error);
            setIsSearching(false);
            setSearchMessage("Search failed. Please try again.");
            setSearchProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Create Database
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Search and store profiles based on keywords, tags, and mentions
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Search Query Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Search Query
                        </label>
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                size={20}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter keywords, $tags, @mentions"
                                disabled={!!currentJobId && isSearching}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Tip: You can copy the search query from{" "}
                            <a
                                href="https://x.com/search-advanced"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                            >
                                Twitter's Advanced Search
                            </a>{" "}
                            and paste it here.
                        </p>
                    </div>

                    {/* Options Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                Max {searchType === "PROFILES" ? "Profiles" : "Tweets"}
                            </label>
                            <input
                                type="number"
                                value={maxCount}
                                onChange={(e) => setMaxCount(parseInt(e.target.value) || 100)}
                                disabled={!!currentJobId && isSearching}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                            />
                        </div>
                        {/* Search Type could be added here if needed, currently defaulted to PROFILES */}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleSearch}
                            disabled={!searchQuery.trim() || (!!currentJobId && isSearching)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                        >
                            {isSearching ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <Database size={20} />
                            )}
                            Create DB
                        </button>
                    </div>

                    {/* Progress Section */}
                    {(isSearching || messageStatus === "FAILED" || messageStatus === "COMPLETED") && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                {messageStatus === "COMPLETED" ? (
                                    <CheckCircle2 className="text-green-400" size={16} />
                                ) : messageStatus === "FAILED" ? (
                                    <AlertCircle className="text-red-400" size={16} />
                                ) : (
                                    <Loader2 className="animate-spin text-blue-400" size={16} />
                                )}
                                <span
                                    className={
                                        messageStatus === "FAILED"
                                            ? "text-red-400"
                                            : messageStatus === "COMPLETED"
                                                ? "text-green-400"
                                                : "text-blue-400"
                                    }
                                >
                                    {searchMessage}
                                </span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                    style={{ width: `${searchProgress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{Math.round(searchProgress)}% Complete</span>
                                {currentJob && (
                                    <span className="text-purple-400">
                                        {currentJob.profilesCount || 0} profiles found
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {showResults && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <h3 className="text-lg font-semibold text-white">
                                Sample Results ({searchResults.length})
                            </h3>

                            {isFetchingTweets ? (
                                <div className="flex items-center justify-center py-8 text-gray-500">
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Loading samples...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                                    {searchResults.map((item, index) => {
                                        // Simple rendering for now since we don't have the full card components
                                        const isProfile = "username" in item;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                                    {isProfile && (item as Profile).profileImageUrl ? (
                                                        <img src={(item as Profile).profileImageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={20} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-white truncate">
                                                        {isProfile ? (item as Profile).name : (item as MongoTweet).user.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        @{isProfile ? (item as Profile).username : (item as MongoTweet).user.username}
                                                    </div>
                                                    {!isProfile && (
                                                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                                                            {(item as MongoTweet).text}
                                                        </p>
                                                    )}
                                                    {isProfile && (item as Profile).description && (
                                                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                                                            {(item as Profile).description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
