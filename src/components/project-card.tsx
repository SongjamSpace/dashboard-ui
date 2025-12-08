"use client";

import { useState } from "react";
import { Settings, Copy, Check, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LeaderboardProject,
  ChartConfig,
} from "@/services/db/leaderboardProjects.db";

interface ProjectCardProps {
  project: LeaderboardProject;
  onProjectUpdate?: (project: LeaderboardProject) => void;
}

interface ChartToggleProps {
  label: string;
  config: ChartConfig;
  onChange: (config: ChartConfig) => void;
}

function ChartToggle({ label, config, onChange }: ChartToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
      <span
        className="text-white font-medium"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {label}
      </span>
      <div className="flex items-center space-x-2">
        <span
          className="text-white/60 text-sm"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Mode: {config.mode}
        </span>
        <button
          disabled
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? "bg-blue-600" : "bg-gray-600"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${config.enabled ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
      </div>
    </div>
  );
}

export function ProjectCard({ project, onProjectUpdate }: ProjectCardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [localProject, setLocalProject] = useState<LeaderboardProject>(project);

  const handleChartConfigChange = (
    chartType: keyof LeaderboardProject,
    config: ChartConfig
  ) => {
    const updatedProject = {
      ...localProject,
      [chartType]: config,
    };
    setLocalProject(updatedProject);
    onProjectUpdate?.(updatedProject);
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(localProject.apiKey);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    } catch (err) {
      console.error("Failed to copy API key: ", err);
    }
  };

  const copyEndpoint = async () => {
    try {
      const endpoint = `https://songjamspace-leaderboard.logesh-063.workers.dev/${localProject.projectId}`;
      await navigator.clipboard.writeText(endpoint);
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } catch (err) {
      console.error("Failed to copy endpoint: ", err);
    }
  };

  const maskedApiKey = localProject.apiKey.replace(/./g, "•");

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {localProject.twitterUsername.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3
              className="text-lg font-semibold text-white"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              @{localProject.twitterUsername}
            </h3>
            {localProject.cashtag && (
              <p
                className="text-white/60 text-sm"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                ${localProject.cashtag}
              </p>
            )}
          </div>
        </div>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gray-900/95 backdrop-blur-sm border-white/20">
            <DialogHeader>
              <DialogTitle
                className="text-white"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Project Settings
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Chart Toggles */}
              <div>
                <h4
                  className="text-white font-semibold mb-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Chart Types
                </h4>
                <div className="space-y-3">
                  <ChartToggle
                    label="Hourly Chart"
                    config={localProject.hourlyChart}
                    onChange={(config) =>
                      handleChartConfigChange("hourlyChart", config)
                    }
                  />
                  <ChartToggle
                    label="Daily Chart"
                    config={localProject.dailyChart}
                    onChange={(config) =>
                      handleChartConfigChange("dailyChart", config)
                    }
                  />
                  <ChartToggle
                    label="Weekly Chart"
                    config={localProject.weeklyChart}
                    onChange={(config) =>
                      handleChartConfigChange("weeklyChart", config)
                    }
                  />
                  <ChartToggle
                    label="Monthly Chart"
                    config={localProject.monthlyChart}
                    onChange={(config) =>
                      handleChartConfigChange("monthlyChart", config)
                    }
                  />
                </div>
              </div>

              {/* API Key Section */}
              <div>
                <h4
                  className="text-white font-semibold mb-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  API Key
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3">
                    <code className="text-white font-mono text-sm">
                      {showApiKey ? localProject.apiKey : maskedApiKey}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyApiKey}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    {copiedApiKey ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* API Endpoints Documentation */}
              <div>
                <h4
                  className="text-white font-semibold mb-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  API Endpoints
                </h4>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs font-mono">
                          GET
                        </span>
                        <div className="flex-1">
                          <code className="text-blue-400 font-mono text-sm break-all">
                            https://songjamspace-leaderboard.logesh-063.workers.dev/
                            {localProject.projectId}
                          </code>
                        </div>
                        <button
                          onClick={copyEndpoint}
                          className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded"
                        >
                          {copiedEndpoint ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <p
                        className="text-white/60 text-sm"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Fetch leaderboard data for this project
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <h5
                        className="text-white/80 text-sm font-medium mb-2"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Response Format:
                      </h5>
                      <div className="bg-black/30 rounded p-3">
                        <code className="text-gray-300 font-mono text-xs">
                          {`[
  {
    "username": "string",
    "name": "string", 
    "totalPoints": number,
    "userId": "string",
    "stakingMultiplier": number
  }
]`}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
