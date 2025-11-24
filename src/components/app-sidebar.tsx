"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers";
import {
    getTranscriptionsByUser,
    Transcription,
} from "@/services/db/transcriptions.db";
import { Plus, LayoutDashboard, Mic2, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppSidebar() {
    const { user, authenticated, logout, login } = useAuth();
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        if (authenticated && user) {
            loadTranscriptions();
        }
    }, [authenticated, user]);

    const loadTranscriptions = async () => {
        if (!user) return;
        try {
            const data = await getTranscriptionsByUser(user.uid);
            setTranscriptions(data);
        } catch (error) {
            console.error("Failed to load transcriptions", error);
        }
    };

    return (
        <div
            className={`w-[260px] bg-[#202123] flex flex-col transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 md:static absolute z-20 h-full border-r border-white/10`}
        >
            <div className="p-4">
                <Link href="/" className="flex items-center gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                        <img src="/images/logo1.png" alt="Logo" className="h-8 w-8" />
                        <span
                            className="text-xl font-black text-white"
                            style={{
                                fontFamily: "Audiowide, cursive",
                                textShadow: "0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)",
                                letterSpacing: "0.1em",
                                fontWeight: 400,
                            }}
                        >
                            SONGJAM
                        </span>
                    </div>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 mb-1">
                    Transcriptions
                </div>

                <Link href="/">
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-md border border-white/20 hover:bg-[#2A2B32] transition-colors text-sm text-white mb-4">
                        <Plus size={16} />
                        New Transcription
                    </button>
                </Link>

                <div className="space-y-1 mb-6">
                    {transcriptions.map((t) => (
                        <div
                            key={t.id}
                            className="group flex items-center gap-3 px-3 py-3 rounded-md hover:bg-[#2A2B32] cursor-pointer text-sm text-gray-100 transition-colors"
                        >
                            <div className="flex-1 truncate relative break-all">
                                {t.title}
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#2A2B32] to-transparent group-hover:from-[#2A2B32] hidden group-hover:block"></div>
                            </div>
                        </div>
                    ))}
                    {authenticated && transcriptions.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No transcriptions yet
                        </div>
                    )}
                    {!authenticated && (
                        <div className="px-3 py-2 text-sm text-gray-500 italic">
                            Login to see history
                        </div>
                    )}
                </div>

                <div className="px-3 py-2 text-xs font-medium text-gray-500 mb-2">
                    Leaderboard
                </div>
                <div className="space-y-1 mb-6">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-3 py-3 rounded-md hover:bg-[#2A2B32] transition-colors text-sm ${pathname === "/dashboard" ? "bg-[#2A2B32] text-white" : "text-gray-100"
                            }`}
                    >
                        <LayoutDashboard size={16} />
                        <div>Dashboard</div>
                    </Link>
                </div>

                <div className="px-3 py-2 text-xs font-medium text-gray-500 mb-2">
                    Marketing
                </div>
                <div className="space-y-1 mb-6">
                    <Link
                        href="/shows"
                        className={`flex items-center gap-3 px-3 py-3 rounded-md hover:bg-[#2A2B32] transition-colors text-sm ${pathname === "/shows" ? "bg-[#2A2B32] text-white" : "text-gray-100"
                            }`}
                    >
                        <Mic2 size={16} />
                        <div>Shows</div>
                    </Link>
                    <Link
                        href="/hosts"
                        className={`flex items-center gap-3 px-3 py-3 rounded-md hover:bg-[#2A2B32] transition-colors text-sm ${pathname === "/hosts" ? "bg-[#2A2B32] text-white" : "text-gray-100"
                            }`}
                    >
                        <Users size={16} />
                        <div>Hosts</div>
                    </Link>
                    <Link
                        href="/auto-dms"
                        className={`flex items-center gap-3 px-3 py-3 rounded-md hover:bg-[#2A2B32] transition-colors text-sm ${pathname === "/auto-dms" ? "bg-[#2A2B32] text-white" : "text-gray-100"
                            }`}
                    >
                        <MessageSquare size={16} />
                        <div>Auto DMs</div>
                    </Link>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-2 border-t border-white/20">
                {authenticated && user ? (
                    <div className="flex items-center justify-between px-3 py-3 mt-1">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="User"
                                    className="w-8 h-8 rounded-sm"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-sm bg-purple-600 flex items-center justify-center text-xs font-bold">
                                    {user?.displayName?.[0] || "U"}
                                </div>
                            )}
                            <div className="text-sm font-medium truncate text-white">
                                {user?.displayName || "User"}
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={login}
                        className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-[#2A2B32] transition-colors text-sm text-white"
                    >
                        <div className="w-8 h-8 rounded-sm bg-gray-600 flex items-center justify-center text-xs font-bold">
                            ?
                        </div>
                        <div className="text-sm font-medium">Log in</div>
                    </button>
                )}
            </div>
        </div>
    );
}
