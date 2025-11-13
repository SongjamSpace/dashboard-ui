"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MicIcon,
  MicOffIcon,
  UploadIcon,
  XIcon,
  PlayIcon,
  PauseIcon,
  Loader2Icon,
  Sparkles,
  Zap,
  Heart,
  Brain,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVoiceWithElevenLabsId } from "@/services/db/voices.db";

interface PersonalityChip {
  id: string;
  label: string;
  description: string;
  category: "personality" | "tone" | "style" | "expertise";
  gradient: string;
  borderColor: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const PERSONALITY_CHIPS: PersonalityChip[] = [
  // Personality Traits
  {
    id: "friendly",
    label: "Friendly",
    description: "Warm and approachable",
    category: "personality",
    gradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
    borderColor: "border-cyan-400/50",
    icon: Heart,
  },
  {
    id: "professional",
    label: "Professional",
    description: "Formal and business-like",
    category: "personality",
    gradient: "from-slate-500/20 via-gray-500/20 to-zinc-500/20",
    borderColor: "border-slate-400/50",
  },
  {
    id: "enthusiastic",
    label: "Enthusiastic",
    description: "Energetic and passionate",
    category: "personality",
    gradient: "from-orange-500/20 via-amber-500/20 to-yellow-500/20",
    borderColor: "border-orange-400/50",
    icon: Zap,
  },
  {
    id: "calm",
    label: "Calm",
    description: "Relaxed and composed",
    category: "personality",
    gradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20",
    borderColor: "border-green-400/50",
  },
  {
    id: "witty",
    label: "Witty",
    description: "Clever and humorous",
    category: "personality",
    gradient: "from-purple-500/20 via-pink-500/20 to-rose-500/20",
    borderColor: "border-purple-400/50",
    icon: Sparkles,
  },
  {
    id: "empathetic",
    label: "Empathetic",
    description: "Understanding and caring",
    category: "personality",
    gradient: "from-pink-500/20 via-rose-500/20 to-red-500/20",
    borderColor: "border-pink-400/50",
    icon: Heart,
  },
  // Tone Options
  {
    id: "conversational",
    label: "Conversational",
    description: "Natural and chatty",
    category: "tone",
    gradient: "from-indigo-500/20 via-blue-500/20 to-cyan-500/20",
    borderColor: "border-indigo-400/50",
    icon: MessageSquare,
  },
  {
    id: "authoritative",
    label: "Authoritative",
    description: "Confident and decisive",
    category: "tone",
    gradient: "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
    borderColor: "border-violet-400/50",
  },
  {
    id: "casual",
    label: "Casual",
    description: "Relaxed and informal",
    category: "tone",
    gradient: "from-teal-500/20 via-cyan-500/20 to-blue-500/20",
    borderColor: "border-teal-400/50",
  },
  {
    id: "supportive",
    label: "Supportive",
    description: "Encouraging and helpful",
    category: "tone",
    gradient: "from-emerald-500/20 via-green-500/20 to-lime-500/20",
    borderColor: "border-emerald-400/50",
  },
  // Style Options
  {
    id: "concise",
    label: "Concise",
    description: "Brief and to the point",
    category: "style",
    gradient: "from-sky-500/20 via-blue-500/20 to-indigo-500/20",
    borderColor: "border-sky-400/50",
  },
  {
    id: "detailed",
    label: "Detailed",
    description: "Thorough and comprehensive",
    category: "style",
    gradient: "from-amber-500/20 via-orange-500/20 to-red-500/20",
    borderColor: "border-amber-400/50",
  },
  {
    id: "storytelling",
    label: "Storytelling",
    description: "Narrative and engaging",
    category: "style",
    gradient: "from-purple-500/20 via-violet-500/20 to-indigo-500/20",
    borderColor: "border-purple-400/50",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  personality: "Personality Traits",
  tone: "Tone",
  style: "Communication Style",
};

export function CreateVoiceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [personality, setPersonality] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeBackgroundNoise, setRemoveBackgroundNoise] = useState(true);
  const [createdVoices, setCreatedVoices] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  const handleFileUpload = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("Audio file size must be less than 10MB");
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Get audio duration
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(audio.duration);
    });
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const removeAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setRecordingTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Clear any existing interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const file = new File([audioBlob], "recording.webm", {
          type: "audio/webm",
        });
        handleFileUpload(file);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer - use a function that directly updates state
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at 30 seconds
          if (newTime >= 30) {
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }
            if (mediaRecorderRef.current && isRecordingRef.current) {
              mediaRecorderRef.current.stop();
              isRecordingRef.current = false;
              setIsRecording(false);
            }
            return 30;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to access microphone. Please check permissions.");
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [handleFileUpload]);

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setAudioDuration(audioRef.current?.duration || 0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleChip = (chipId: string) => {
    setSelectedChips((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chipId)) {
        newSet.delete(chipId);
      } else {
        newSet.add(chipId);
      }
      return newSet;
    });
  };

  // Generate personality text from selected chips
  useEffect(() => {
    if (selectedChips.size === 0) {
      setPersonality("");
      return;
    }

    const selectedChipData = PERSONALITY_CHIPS.filter((chip) =>
      selectedChips.has(chip.id)
    );

    const byCategory = selectedChipData.reduce((acc, chip) => {
      if (!acc[chip.category]) {
        acc[chip.category] = [];
      }
      acc[chip.category].push(chip.label.toLowerCase());
      return acc;
    }, {} as Record<string, string[]>);

    let personalityText =
      "You are a voice agent with the following characteristics:\n\n";

    if (byCategory.personality?.length) {
      personalityText += `Personality: ${byCategory.personality.join(", ")}.\n`;
    }
    if (byCategory.tone?.length) {
      personalityText += `Tone: ${byCategory.tone.join(", ")}.\n`;
    }
    if (byCategory.style?.length) {
      personalityText += `Communication style: ${byCategory.style.join(
        ", "
      )}.\n`;
    }
    if (byCategory.expertise?.length) {
      personalityText += `Expertise: ${byCategory.expertise.join(", ")}.\n`;
    }

    personalityText +=
      "\nAdapt your responses to match these characteristics while being helpful, accurate, and engaging.";

    setPersonality(personalityText);
  }, [selectedChips]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !audioFile || !personality.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Add voice to ElevenLabs first
      const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      if (!elevenLabsApiKey) {
        throw new Error("ElevenLabs API key not configured");
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("files", audioFile);
      formData.append(
        "remove_background_noise",
        removeBackgroundNoise.toString()
      );

      const elevenLabsResponse = await fetch(
        "https://api.elevenlabs.io/v1/voices/add",
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsApiKey,
          },
          body: formData,
        }
      );

      if (!elevenLabsResponse.ok) {
        const errorData = await elevenLabsResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message?.message ||
            errorData.message ||
            `Failed to add voice to ElevenLabs: ${elevenLabsResponse.statusText}`
        );
      }

      const elevenLabsResult = await elevenLabsResponse.json();
      const elevenLabsVoiceID = elevenLabsResult.voice_id;

      if (!elevenLabsVoiceID) {
        throw new Error("Failed to get voice ID from ElevenLabs");
      }

      // Step 2: Create voice document in Firestore with ElevenLabs voice ID (no storage upload)
      const voiceDocId = await createVoiceWithElevenLabsId(
        name.trim(),
        personality.trim(),
        elevenLabsVoiceID,
        audioDuration > 0 ? audioDuration : undefined
      );

      // Step 3: Store in localStorage
      const newVoice = { id: elevenLabsVoiceID, name: name.trim() };
      const updatedVoices = [...createdVoices, newVoice];
      setCreatedVoices(updatedVoices);
      localStorage.setItem("createdVoices", JSON.stringify(updatedVoices));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("voicesUpdated"));

      // Success - reset form
      setName("");
      setSelectedChips(new Set());
      setPersonality("");
      setAudioFile(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setAudioDuration(0);
      setRecordingTime(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setError(null);
    } catch (err) {
      console.error("Error creating voice agent:", err);
      setError(err instanceof Error ? err.message : "Failed to create voice");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    audioFile,
    personality,
    audioDuration,
    audioUrl,
    removeBackgroundNoise,
    createdVoices,
  ]);

  // Load created voices from localStorage on mount (needed for saving logic)
  useEffect(() => {
    const stored = localStorage.getItem("createdVoices");
    if (stored) {
      try {
        setCreatedVoices(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing stored voices:", error);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, isRecording]);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Voice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Voice Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter voice name"
              className="w-full"
            />
          </div>

          {/* Audio Upload/Record Area */}
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label>Audio Note (30 seconds) *</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="removeNoise"
                  checked={removeBackgroundNoise}
                  onChange={(e) => setRemoveBackgroundNoise(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                />
                <Label
                  htmlFor="removeNoise"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remove background noise
                </Label>
              </div>
            </div>
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25",
                audioFile && "border-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!audioFile ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <UploadIcon className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drop your audio file here or
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: MP3, WAV, OGG, WEBM
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFileClick}
                    >
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isRecording && recordingTime >= 30}
                    >
                      {isRecording ? (
                        <>
                          <MicOffIcon className="h-4 w-4 mr-2" />
                          Stop Recording ({30 - recordingTime}s)
                        </>
                      ) : (
                        <>
                          <MicIcon className="h-4 w-4 mr-2" />
                          Record Now
                        </>
                      )}
                    </Button>
                  </div>
                  {isRecording && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-medium text-red-600">
                          Recording... {formatTime(recordingTime)} / 30s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4 w-full max-w-md">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? (
                        <PauseIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {audioFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(audioDuration)} •{" "}
                        {(audioFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeAudio}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personality/Prompt Area */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personality">Personality & Tone *</Label>
              <p className="text-xs text-muted-foreground">
                Select multiple chips to customize your voice agent's
                personality
              </p>
            </div>

            {/* Chips organized by category */}
            <div className="space-y-6">
              {(["personality", "tone", "style", "expertise"] as const).map(
                (category) => {
                  const categoryChips = PERSONALITY_CHIPS.filter(
                    (chip) => chip.category === category
                  );
                  if (categoryChips.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground/90">
                        {CATEGORY_LABELS[category]}
                      </h4>
                      <div className="flex flex-wrap gap-2.5">
                        {categoryChips.map((chip) => {
                          const isSelected = selectedChips.has(chip.id);
                          const IconComponent = chip.icon;

                          return (
                            <motion.button
                              key={chip.id}
                              type="button"
                              onClick={() => toggleChip(chip.id)}
                              className={cn(
                                "relative group px-4 py-2.5 rounded-lg border-2 transition-all duration-300 text-left",
                                "backdrop-blur-sm",
                                isSelected
                                  ? `bg-gradient-to-br ${chip.gradient} ${chip.borderColor} border-opacity-60 shadow-lg`
                                  : "bg-background/50 border-border/50 hover:border-border hover:bg-accent/50"
                              )}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="flex items-center gap-2.5">
                                {IconComponent && (
                                  <IconComponent
                                    className={cn(
                                      "h-4 w-4 transition-colors",
                                      isSelected
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                )}
                                <div className="flex flex-col">
                                  <span
                                    className={cn(
                                      "text-sm font-medium transition-colors",
                                      isSelected
                                        ? "text-foreground"
                                        : "text-foreground/80"
                                    )}
                                  >
                                    {chip.label}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-xs transition-colors",
                                      isSelected
                                        ? "text-foreground/70"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {chip.description}
                                  </span>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    className="ml-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 30,
                                    }}
                                  >
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  </motion.div>
                                )}
                              </div>
                              {isSelected && (
                                <motion.div
                                  className={cn(
                                    "absolute inset-0 rounded-lg opacity-20",
                                    `bg-gradient-to-br ${chip.gradient}`
                                  )}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 0.2 }}
                                  transition={{ duration: 0.3 }}
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Generated personality preview */}
            {personality && (
              <div className="mt-4 p-4 rounded-lg border border-border/50 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Generated Personality Prompt:
                </p>
                <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {personality}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {personality.length} characters
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/15 border border-destructive/50 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                !name.trim() ||
                !audioFile ||
                !personality.trim() ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Voice"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
