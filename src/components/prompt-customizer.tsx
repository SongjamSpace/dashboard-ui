"use client";

import React from "react";

// Actually, I'll use standard inputs for now to avoid dependency issues if shadcn isn't set up for slider
import { Settings2, Sparkles } from "lucide-react";

export interface PromptSettings {
    tone: string;
    length: string;
    enthusiasm: number;
    personalization: number;
    customInstructions: string;
    keyPoints: string[];
    callToAction: string;
}

interface Props {
    settings: PromptSettings;
    onChange: (settings: PromptSettings) => void;
}

export default function PromptCustomizer({ settings, onChange }: Props) {
    const handleChange = (key: keyof PromptSettings, value: any) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Settings2 className="text-purple-400" size={20} />
                <h3 className="text-lg font-semibold text-white">Prompt Settings</h3>
            </div>

            {/* Tone Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tone
                </label>
                <select
                    value={settings.tone}
                    onChange={(e) => handleChange("tone", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="urgent">Urgent</option>
                    <option value="witty">Witty</option>
                </select>
            </div>

            {/* Length Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Length
                </label>
                <div className="flex gap-2">
                    {["short", "moderate", "long"].map((len) => (
                        <button
                            key={len}
                            onClick={() => handleChange("length", len)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${settings.length === len
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                }`}
                        >
                            {len.charAt(0).toUpperCase() + len.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300">
                            Enthusiasm
                        </label>
                        <span className="text-xs text-gray-400">{settings.enthusiasm}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.enthusiasm}
                        onChange={(e) => handleChange("enthusiasm", parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300">
                            Personalization
                        </label>
                        <span className="text-xs text-gray-400">
                            {settings.personalization}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.personalization}
                        onChange={(e) =>
                            handleChange("personalization", parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
            </div>

            {/* Custom Instructions */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Instructions
                </label>
                <textarea
                    value={settings.customInstructions}
                    onChange={(e) => handleChange("customInstructions", e.target.value)}
                    placeholder="Any specific instructions for the AI..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                />
            </div>

            {/* Call to Action */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Call to Action Style
                </label>
                <select
                    value={settings.callToAction}
                    onChange={(e) => handleChange("callToAction", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="soft">Soft (e.g., "Let me know what you think")</option>
                    <option value="direct">Direct (e.g., "Click here to join")</option>
                    <option value="question">Question (e.g., "Are you interested?")</option>
                    <option value="none">None</option>
                </select>
            </div>
        </div>
    );
}
