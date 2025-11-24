"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import { useAuth } from "@/components/providers";
import {
    Campaign,
    createCampaign,
    getCampaign,
    updateCampaign,
} from "@/services/db/campaign.service";
import { getSnapJobsByUserId, SnapJob } from "@/services/db/snaps.service";
import PromptCustomizer, { PromptSettings } from "@/components/prompt-customizer";
import {
    Loader2,
    Rocket,
    Sparkles,
    MessageSquare,
    Database,
} from "lucide-react";
import LoginScreen from "@/components/login-screen";
import CreateDatabaseModal from "@/components/create-database-modal";

export default function AutoDMsPage() {
    const { user, authenticated, login, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("campaignId");

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [promptSettings, setPromptSettings] = useState<PromptSettings>({
        tone: "professional",
        length: "moderate",
        enthusiasm: 50,
        personalization: 75,
        customInstructions: "",
        keyPoints: [],
        callToAction: "soft",
    });
    const [isSampleDMsGenerating, setIsSampleDMsGenerating] = useState(false);
    const [isGeneratingDMs, setIsGeneratingDMs] = useState(false);
    const [sampleDm, setSampleDm] = useState("");
    const [campaignTitle, setCampaignTitle] = useState("");
    const [campaignDescription, setCampaignDescription] = useState("");
    const [numListeners, setNumListeners] = useState(10);
    const [snapJobs, setSnapJobs] = useState<SnapJob[]>([]);
    const [selectedSnapIds, setSelectedSnapIds] = useState<string[]>([]);
    const [isCustomMode, setIsCustomMode] = useState(true);
    const [selectedSnapJobProfilesCount, setSelectedSnapJobProfilesCount] =
        useState(0);
    const [isCreateDbModalOpen, setIsCreateDbModalOpen] = useState(false);

    // Fetch campaign if ID exists
    useEffect(() => {
        const fetchCampaign = async () => {
            if (campaignId && user) {
                const campaignData = await getCampaign(campaignId);
                if (campaignData) {
                    if (campaignData.userId !== user.uid) {
                        alert("You are not authorized to access this campaign");
                        router.push("/auto-dms");
                        return;
                    }
                    setCampaign(campaignData);
                    setCampaignTitle(campaignData.spaceTitle || "");
                    setCampaignDescription(campaignData.description || "");
                } else {
                    alert("Campaign not found");
                    router.push("/auto-dms");
                }
            }
        };
        fetchCampaign();
    }, [campaignId, user, router]);

    // Fetch SnapJobs
    useEffect(() => {
        if (user?.uid) {
            getSnapJobsByUserId(user.uid).then(setSnapJobs);
        }
    }, [user?.uid]);

    const handleSnapJobToggle = (snapJobId: string) => {
        setSelectedSnapIds((prev) => {
            const newSelection = prev.includes(snapJobId)
                ? prev.filter((id) => id !== snapJobId)
                : [...prev, snapJobId];

            const totalProfilesCount = snapJobs
                .filter((job) => newSelection.includes(job.id!))
                .reduce((sum, job) => sum + job.profilesCount, 0);

            setSelectedSnapJobProfilesCount(totalProfilesCount);

            if (newSelection.length > 0) {
                setIsCustomMode(false);
                setNumListeners(totalProfilesCount);
            } else {
                setIsCustomMode(true);
                setNumListeners(10);
            }

            return newSelection;
        });
    };

    const handleGenerateSampleDM = async () => {
        if (!campaignTitle.trim()) {
            alert("Please add a campaign title");
            return;
        }
        setIsSampleDMsGenerating(true);
        try {
            const token = await user?.getIdToken();
            if (!token) {
                login();
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SONGJAM_SERVER}/api/generate-sample-dm`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        campaignTitle,
                        campaignDescription,
                        promptSettings,
                        ctaType: "auto",
                    }),
                }
            );

            const data = await response.json();
            if (data.result) {
                setSampleDm(data.result);
            } else {
                throw new Error("No result in response");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate sample DM");
        } finally {
            setIsSampleDMsGenerating(false);
        }
    };

    const handleGenerateDMs = async () => {
        if (!campaignTitle.trim()) {
            alert("Please add a campaign title");
            return;
        }

        if (!user) {
            login();
            return;
        }

        setIsGeneratingDMs(true);
        try {
            const token = await user.getIdToken();
            let activeCampaignId = campaignId;

            if (!activeCampaignId && !campaign) {
                const newCampaign: Omit<Campaign, "id"> = {
                    ctaType: "auto-dms",
                    ctaTarget: campaignTitle,
                    status: "DRAFT",
                    spaceId: "",
                    spaceTitle: campaignTitle,
                    projectId: "default", // TODO: Get actual project ID
                    userId: user.uid,
                    createdAt: Date.now(),
                    description: campaignDescription,
                    isBroadcast: false,
                };

                const createdCampaign = await createCampaign(newCampaign);
                activeCampaignId = createdCampaign.id!;
                setCampaign(createdCampaign);
            } else if (activeCampaignId && campaign) {
                await updateCampaign(activeCampaignId, {
                    status: "DRAFT",
                    ctaTarget: campaignTitle,
                    description: campaignDescription,
                    isBroadcast: false,
                });
            }

            if (!activeCampaignId) {
                throw new Error("Failed to create/update campaign");
            }

            await fetch(
                `${process.env.NEXT_PUBLIC_SONGJAM_SERVER}/api/generate-auto-dms`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        campaignId: activeCampaignId,
                        noOfDms: numListeners,
                        promptSettings,
                        lang: "en",
                        snapIds: selectedSnapIds,
                    }),
                }
            );

            alert(`Generating ${numListeners} DMs... This may take a few minutes.`);
            if (!campaignId) {
                router.push(`/auto-dms?campaignId=${activeCampaignId}`);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate DMs");
        } finally {
            setIsGeneratingDMs(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#343541] flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    if (!authenticated) {
        return (
            <LoginScreen
                login={login}
                title="Auto DMs Studio"
                subtitle="Automate your DM campaigns"
                description="Please login to access Auto DMs Studio and manage your campaigns."
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#343541] text-white pb-20">
            <div className="relative z-20 px-4 py-4">
                <Navbar hideNavigation={true} title="Auto DMs Studio" />
            </div>

            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Settings */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="text-purple-400" />
                            <h2 className="text-xl font-bold">Campaign Details</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Campaign Title *
                                </label>
                                <input
                                    type="text"
                                    value={campaignTitle}
                                    onChange={(e) => setCampaignTitle(e.target.value)}
                                    placeholder="e.g., Twitter Space on AI & Web3"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    AI Context
                                </label>
                                <textarea
                                    value={campaignDescription}
                                    onChange={(e) => setCampaignDescription(e.target.value)}
                                    placeholder="Add details about your campaign..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <PromptCustomizer
                                    settings={promptSettings}
                                    onChange={setPromptSettings}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Preview & Actions */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-6">DMs Preview & Actions</h2>

                        {/* SnapJobs Selection */}
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-gray-300 mb-3">
                                Target Audience
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {snapJobs.length > 0 ? (
                                    snapJobs
                                        .filter((job) => job.status === "COMPLETED")
                                        .map((job) => (
                                            <button
                                                key={job.id}
                                                onClick={() => handleSnapJobToggle(job.id!)}
                                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedSnapIds.includes(job.id!)
                                                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                    }`}
                                            >
                                                {job.searchQuery} ({job.profilesCount})
                                            </button>
                                        ))
                                ) : (
                                    <span className="text-gray-500 text-sm italic">
                                        No saved audiences found.
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setIsCustomMode(true);
                                        setSelectedSnapIds([]);
                                        setNumListeners(10);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${isCustomMode
                                        ? "bg-pink-500/20 border-pink-500 text-pink-400"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    Custom Count
                                </button>
                                <button
                                    onClick={() => setIsCreateDbModalOpen(true)}
                                    className="px-3 py-1.5 rounded-full text-sm border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                                >
                                    <Database size={14} />
                                    Create Database
                                </button>
                            </div>

                            {isCustomMode && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Number of DMs to Generate
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={numListeners}
                                        onChange={(e) => setNumListeners(Number(e.target.value))}
                                        className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Sample DM Preview */}
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-gray-300 mb-3">
                                Generated Sample
                            </h3>
                            {sampleDm ? (
                                <div className="bg-[#15202b] border border-white/10 rounded-xl p-4 shadow-lg">
                                    <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                                        {sampleDm}
                                    </p>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500">
                                    <MessageSquare size={32} className="mb-2 opacity-50" />
                                    <p>Generate a sample DM to see how it looks</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={handleGenerateSampleDM}
                                disabled={isSampleDMsGenerating || !campaignTitle.trim()}
                                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSampleDMsGenerating ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Sparkles size={20} />
                                )}
                                <span>Preview Sample</span>
                            </button>

                            <button
                                onClick={handleGenerateDMs}
                                disabled={isGeneratingDMs || !campaignTitle.trim()}
                                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-purple-500/20"
                            >
                                {isGeneratingDMs ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Rocket size={20} />
                                )}
                                <span>Generate DMs</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <CreateDatabaseModal
                isOpen={isCreateDbModalOpen}
                onClose={() => setIsCreateDbModalOpen(false)}
            />
        </div>
    );
}
