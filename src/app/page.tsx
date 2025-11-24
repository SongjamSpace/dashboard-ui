"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers";
import LoginScreen from "@/components/login-screen";
import { createTranscription } from "@/services/db/transcriptions.db";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/navbar";

export default function LandingPage() {
    const { ready, authenticated, login, user, twitterObj } = useAuth();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const extractSpaceId = (inputUrl: string) => {
        const match = inputUrl.match(/\/spaces\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    };

    const handleTranscribe = async () => {
        if (!authenticated) {
            login();
            return;
        }

        if (!url) return;
        const spaceId = extractSpaceId(url);
        if (!spaceId) {
            alert("Invalid Space URL");
            return;
        }

        setLoading(true);
        try {
            // 1. Call server API
            const response = await fetch(
                `https://api.songjam.space/get-space/${spaceId}`
            );
            if (!response.ok) throw new Error("Failed to fetch space details");
            const spaceData = await response.json();

            // 2. Create Firebase doc
            const transcriptionData = {
                spaceUrl: url,
                title: spaceData.title || "Untitled Space",
                userInfo: {
                    uid: user!.uid,
                    displayName: user!.displayName,
                    email: user!.email,
                    photoURL: user!.photoURL,
                    twitterUsername: twitterObj?.username,
                },
                spaceData: spaceData,
                status: "pending" as const,
            };

            await createTranscription(transcriptionData);

            // Force reload or some way to update sidebar? 
            // Ideally sidebar listens to firestore, but for now a reload or just waiting is fine as sidebar fetches on mount/auth
            // Actually, sidebar is in layout, so it won't re-fetch automatically unless we trigger it.
            // For now, let's just clear the URL. The user can see it in sidebar if they refresh or if we implement real-time listeners later.
            window.location.reload();

            setUrl("");
        } catch (error) {
            console.error("Error transcribing:", error);
            alert("Failed to start transcription. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!ready) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#343541] text-white font-sans">
            {/* Navbar */}
            <div className="relative z-20 px-4 py-4">
                <Navbar hideNavigation={true} title="Transcription" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                        Hello, {user?.displayName}
                    </h1>
                </div>

                <div className="w-full max-w-3xl relative">
                    <div className="relative flex items-center w-full p-4 bg-[#40414F] rounded-xl shadow-lg border border-black/10 focus-within:border-gray-500/50 transition-colors">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter a Space URL to start transcribing..."
                            className="w-full bg-transparent text-white text-base focus:outline-none pr-12"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !loading && url) {
                                    handleTranscribe();
                                }
                            }}
                        />
                        <button
                            onClick={handleTranscribe}
                            disabled={loading || !url}
                            className={`absolute right-3 p-2 rounded-md transition-colors ${loading || !url
                                ? "text-gray-500 cursor-not-allowed"
                                : "bg-[#19c37d] text-white hover:bg-[#1a885d]"
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <svg
                                    stroke="currentColor"
                                    fill="none"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                    height="1em"
                                    width="1em"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            )}
                        </button>
                    </div>
                    {/* <div className="text-xs text-center text-gray-500 mt-3">
                        Songjam Transcribe may produce inaccurate information about people,
                        places, or facts.
                    </div> */}
                </div>
            </div>
        </div>
    );
}
