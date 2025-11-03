"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import {
  X,
  Mic,
  Image,
  Calendar,
  Upload,
  Check,
  Link,
  Users,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import { PricingCard, ScheduledShow } from "@/services/db/shows.db";
import SelectedSlotsGrid from "./selected-slots-grid";

interface Speaker {
  userId: string;
  displayName: string;
  twitterScreenName: string; // without the leading @ in API, we'll render with @
  avatarUrl?: string;
  isVerified?: boolean;
  admin?: boolean;
  speaker?: boolean;
  role: "regular" | "guest" | "unassigned";
}

interface SpaceHistoryUser {
  userId: string;
  displayName: string;
  twitterScreenName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  admin?: boolean;
  speaker?: boolean;
}

interface SpaceHistoryMetadata {
  title?: string;
  mediaKey?: string;
  startedAt?: number;
  isSpaceAvailableForReplay?: boolean;
  totalReplayWatched?: number;
  totalLiveListeners?: number;
  tweetId?: string;
  admins?: SpaceHistoryUser[];
  speakers?: SpaceHistoryUser[];
  // allow additional fields returned by the API without forcing any casts
  [key: string]: unknown;
}

interface ScheduleFormProps {
  selectedSlots: { day: number; time: string }[];
  selectedPattern: "one-time" | "specific-days" | "weekdays" | "daily";
  onClose: () => void;
  onSubmit: (showData: ScheduledShow) => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ScheduleForm({
  selectedSlots,
  selectedPattern,
  onClose,
  onSubmit,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    showName: "",
    description: "",
    coverImage: "",
    duration: 60,
    previousSpaceUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isFetchingSpeakers, setIsFetchingSpeakers] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [pricingCards, setPricingCards] = useState<PricingCard[]>([]);
  const [payoutAddress, setPayoutAddress] = useState("");
  const [speakersText, setSpeakersText] = useState("");
  const [spaceHistoryMetadata, setSpaceHistoryMetadata] = useState<any | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        coverImage: "Please select an image file",
      }));
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        coverImage: "Image size must be less than 2MB",
      }));
      return;
    }

    // Clear any previous errors
    setErrors((prev) => {
      const { coverImage, ...rest } = prev;
      return rest;
    });

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setFormData((prev) => ({ ...prev, coverImage: result }));
    };
    reader.readAsDataURL(file);
  };

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

  const removeImage = () => {
    setImagePreview("");
    setFormData((prev) => ({ ...prev, coverImage: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fetchSpeakersFromUrl = async (url: string) => {
    if (!url.trim()) return;
    const spaceId = url.split("/").pop();
    if (!spaceId) return;

    setIsFetchingSpeakers(true);
    setFetchSuccess(false);
    setErrors((prev) => {
      const { previousSpaceUrl, ...rest } = prev;
      return rest;
    });

    try {
      // // Simulate API call - In a real app, this would fetch from Twitter Spaces API
      // await new Promise((resolve) => setTimeout(resolve, 1500));

      // // Mock data - simulating fetched speakers
      // const mockSpeakers: Speaker[] = [
      //   {
      //     id: "1",
      //     name: "John Smith",
      //     handle: "@johnsmith",
      //     avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=john`,
      //     role: "unassigned",
      //   },
      //   {
      //     id: "2",
      //     name: "Sarah Wilson",
      //     handle: "@sarahw",
      //     avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=sarah`,
      //     role: "unassigned",
      //   },
      //   {
      //     id: "3",
      //     name: "Mike Chen",
      //     handle: "@mikechen",
      //     avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mike`,
      //     role: "unassigned",
      //   },
      // ];
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SONGJAM_SERVER}/space/details?spaceId=${spaceId}`
      );
      if (response.status !== 200) {
        setErrors((prev) => ({
          ...prev,
          previousSpaceUrl: "Failed to fetch speakers from this URL",
        }));
        return;
      }
      const data = response.data;
      if (!data?.success || !data?.result) {
        setErrors((prev) => ({
          ...prev,
          previousSpaceUrl: "Failed to fetch speakers from this URL",
        }));
        return;
      }

      const result = data.result;
      setSpaceHistoryMetadata(result);

      const admins = Array.isArray(result.admins) ? result.admins : [];
      const fetchedSpeakers = Array.isArray(result.speakers)
        ? result.speakers
        : [];

      const combinedUsers = [...admins, ...fetchedSpeakers];
      const uniqueByUserId = new Map<string, any>();
      combinedUsers.forEach((u: any) => {
        if (u?.userId) uniqueByUserId.set(String(u.userId), u);
      });

      const apiSpeakers: Speaker[] = Array.from(uniqueByUserId.values()).map(
        (u: any) => ({
          userId: String(u.userId ?? ""),
          displayName: String(u.displayName ?? ""),
          twitterScreenName: String(u.twitterScreenName ?? ""),
          avatarUrl: u.avatarUrl || undefined,
          isVerified: Boolean(u.isVerified),
          admin: Boolean(u.admin),
          speaker: Boolean(u.speaker),
          role: "regular",
        })
      );

      setSpeakers(apiSpeakers);
      setFetchSuccess(true);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        previousSpaceUrl: "Failed to fetch speakers from this URL",
      }));
    } finally {
      setIsFetchingSpeakers(false);
    }
  };

  const handleSpeakerRoleChange = (
    speakerId: string,
    role: "regular" | "guest"
  ) => {
    setSpeakers((prev) =>
      prev.map((speaker) =>
        speaker.userId === speakerId ? { ...speaker, role } : speaker
      )
    );
  };

  const handleRemoveSpeaker = (speakerId: string) => {
    setSpeakers((prev) =>
      prev.filter((speaker) => speaker.userId !== speakerId)
    );
  };

  const clearSpeakers = () => {
    setSpeakers([]);
    setFormData((prev) => ({ ...prev, previousSpaceUrl: "" }));
  };

  const handleSpeakersTextChange = (text: string) => {
    setSpeakersText(text);
  };

  const addSpeakerFromInput = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;

    const cleanUsername = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
    const handle = `@${cleanUsername}`;

    const exists = speakers.some(
      (s) => `@${s.twitterScreenName}`.toLowerCase() === handle.toLowerCase()
    );
    if (exists) {
      setSpeakersText("");
      return;
    }

    const newSpeaker: Speaker = {
      userId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      displayName: "",
      twitterScreenName: cleanUsername,
      avatarUrl: undefined,
      isVerified: false,
      admin: false,
      speaker: true,
      role: "regular",
    };

    setSpeakers((prev) => [...prev, newSpeaker]);
    setSpeakersText("");
  };

  const addPricingCard = () => {
    const newCard: PricingCard = {
      id: Date.now().toString(),
      label: "",
      description: "",
      pricing: 0,
      includedServices: [""],
    };
    setPricingCards((prev) => [...prev, newCard]);
  };

  const removePricingCard = (cardId: string) => {
    setPricingCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const updatePricingCard = (cardId: string, updates: Partial<PricingCard>) => {
    setPricingCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card))
    );
  };

  const addServiceToPricingCard = (cardId: string) => {
    setPricingCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, includedServices: [...card.includedServices, ""] }
          : card
      )
    );
  };

  const removeServiceFromPricingCard = (
    cardId: string,
    serviceIndex: number
  ) => {
    setPricingCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              includedServices: card.includedServices.filter(
                (_, index) => index !== serviceIndex
              ),
            }
          : card
      )
    );
  };

  const updateServiceInPricingCard = (
    cardId: string,
    serviceIndex: number,
    value: string
  ) => {
    setPricingCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              includedServices: card.includedServices.map((service, index) =>
                index === serviceIndex ? value : service
              ),
            }
          : card
      )
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.showName.trim()) {
      newErrors.showName = "Show name is required";
    } else if (formData.showName.length > 50) {
      newErrors.showName = "Show name must be 50 characters or less";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }

    // Validate pricing cards
    pricingCards.forEach((card, index) => {
      if (
        card.label.trim() &&
        (!card.description.trim() || card.pricing <= 0)
      ) {
        newErrors[`pricing_${index}`] = "Complete all fields for pricing cards";
      } else if (
        card.description.trim() &&
        (!card.label.trim() || card.pricing <= 0)
      ) {
        newErrors[`pricing_${index}`] = "Complete all fields for pricing cards";
      } else if (
        card.pricing > 0 &&
        (!card.label.trim() || !card.description.trim())
      ) {
        newErrors[`pricing_${index}`] = "Complete all fields for pricing cards";
      }

      // Validate included services
      const emptyServices = card.includedServices.filter(
        (service) => !service.trim()
      );
      if (emptyServices.length > 0 && card.includedServices.length > 1) {
        newErrors[`pricing_services_${index}`] =
          "Remove empty services or fill them in";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Convert selectedSlots to schedule format (day + time only)
    const schedule = selectedSlots.map((slot) => ({
      day: DAYS[slot.day] ?? DAYS[0],
      time: slot.time,
    }));

    // Group selected slots by day and time for better handling
    const baseShowData = {
      showName: formData.showName,
      description: formData.description,
      coverImage: formData.coverImage,
      duration: formData.duration,
      schedule,
      participants: speakers.length > 0 ? speakers : [],
      pricingCards:
        pricingCards.length > 0
          ? pricingCards.filter(
              (card) =>
                card.label.trim() && card.description.trim() && card.pricing > 0
            )
          : [],
      payoutAddress: payoutAddress.trim() || "",
      spaceHistoryMetadata: spaceHistoryMetadata ?? {},
    };

    // Always create a single show with all selected slots
    const showData: Omit<ScheduledShow, "id"> = baseShowData;

    setShowSuccess(true);
    await onSubmit(showData);
    setIsSubmitting(false);
    setShowSuccess(false);
  };

  const formatTimeSlot = (day: number, time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${DAYS[day]} at ${displayHour}:${minutes} ${ampm}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-[oklch(0.145_0_0)] to-[oklch(0.125_0_0)] rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Mic className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Schedule Show
                </h2>
                <p
                  className="text-white/70 text-sm"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {selectedSlots.length} time slot
                  {selectedSlots.length > 1 ? "s" : ""} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Selected Time Slots */}
            <SelectedSlotsGrid selectedSlots={selectedSlots} />

            {/* Show Name */}
            <div>
              <label
                className="block text-white font-medium mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Show Name *
              </label>
              <input
                type="text"
                value={formData.showName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, showName: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                placeholder="Enter your show name"
                maxLength={50}
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              {errors.showName && (
                <p className="text-red-400 text-sm mt-1">{errors.showName}</p>
              )}
              <p className="text-white/60 text-xs mt-1">
                {formData.showName.length}/50 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-white font-medium mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 resize-none"
                placeholder="Describe your show content and topics"
                rows={4}
                maxLength={500}
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.description}
                </p>
              )}
              <p className="text-white/60 text-xs mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Previous Space URL */}
            <div>
              <label
                className="block text-white font-medium mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Add Speakers
              </label>
              <p
                className="text-white/60 text-sm mb-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Fetch other speakers details from a previous Twitter Space to
                label as regulars or guests
              </p>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={formData.previousSpaceUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      previousSpaceUrl: e.target.value,
                    }))
                  }
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                  placeholder="https://x.com/i/spaces/..."
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() =>
                    fetchSpeakersFromUrl(formData.previousSpaceUrl)
                  }
                  disabled={
                    !formData.previousSpaceUrl.trim() || isFetchingSpeakers
                  }
                  className="px-4 py-3 bg-blue-500/20 border border-blue-400/40 rounded-lg text-blue-300 font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {isFetchingSpeakers ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></div>
                      <span>Fetching...</span>
                    </>
                  ) : fetchSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Fetched!</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      <span>Fetch</span>
                    </>
                  )}
                </button>
              </div>
              {errors.previousSpaceUrl && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.previousSpaceUrl}
                </p>
              )}
            </div>

            {/* Fetched Speakers */}
            {speakers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <label
                      className="text-white font-medium"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Fetched Speakers ({speakers.length})
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={clearSpeakers}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Clear All
                  </button>
                </div>
                <p
                  className="text-white/60 text-sm mb-4"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Label these profiles as regulars (frequent co-hosts) or guests
                  (occasional speakers)
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {speakers.map((speaker) => (
                    <div
                      key={speaker.userId}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {speaker.avatarUrl ? (
                          <img
                            src={speaker.avatarUrl}
                            alt={speaker.displayName}
                            className="w-10 h-10 rounded-full bg-purple-500/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-300 text-sm font-medium">
                              {(
                                speaker.displayName ||
                                speaker.twitterScreenName ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p
                            className="text-white font-medium"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {speaker.displayName}
                          </p>
                          <p
                            className="text-white/60 text-sm"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {speaker.twitterScreenName
                              ? `@${speaker.twitterScreenName}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSpeakerRoleChange(speaker.userId, "regular")
                          }
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            speaker.role === "regular"
                              ? "bg-green-500/30 border border-green-400/50 text-green-300"
                              : "bg-white/5 border border-white/20 text-white/70 hover:bg-green-500/10 hover:border-green-400/30"
                          }`}
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <div className="flex items-center space-x-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Regular</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSpeakerRoleChange(speaker.userId, "guest")
                          }
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            speaker.role === "guest"
                              ? "bg-blue-500/30 border border-blue-400/50 text-blue-300"
                              : "bg-white/5 border border-white/20 text-white/70 hover:bg-blue-500/10 hover:border-blue-400/30"
                          }`}
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <div className="flex items-center space-x-1">
                            <UserX className="w-3.5 h-3.5" />
                            <span>Guest</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpeaker(speaker.userId)}
                          className="p-2 rounded-lg text-sm font-medium transition-all bg-white/5 border border-white/20 text-white/60 hover:bg-red-500/10 hover:border-red-400/40 hover:text-red-200"
                          style={{ fontFamily: "Inter, sans-serif" }}
                          aria-label={`Remove ${
                            speaker.displayName || "speaker"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-400/30 border border-green-400/50 rounded"></div>
                      <span className="text-white/80">
                        Regulars:{" "}
                        {speakers.filter((s) => s.role === "regular").length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-400/30 border border-blue-400/50 rounded"></div>
                      <span className="text-white/80">
                        Guests:{" "}
                        {speakers.filter((s) => s.role === "guest").length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-white/10 border border-white/20 rounded"></div>
                      <span className="text-white/80">
                        Unassigned:{" "}
                        {speakers.filter((s) => s.role === "unassigned").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cover Image */}
            <div>
              <label
                className="block text-white font-medium mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Cover Image
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                /* Image Preview */
                <div className="relative">
                  <div className="border border-white/20 rounded-lg p-2 bg-white/5">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Upload Area */
                <div
                  onClick={handleFileClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? "border-purple-400/70 bg-purple-500/10"
                      : "border-white/20 hover:border-white/40 hover:bg-white/5"
                  }`}
                >
                  <Upload className="w-8 h-8 text-white/50 mx-auto mb-2" />
                  <p
                    className="text-white/70 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Drag and drop an image here, or click to browse
                  </p>
                  <p
                    className="text-white/50 text-xs mt-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    PNG, JPG up to 2MB
                  </p>
                </div>
              )}

              {errors.coverImage && (
                <p className="text-red-400 text-sm mt-2">{errors.coverImage}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label
                className="block text-white font-medium mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value),
                  }))
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-gray-800"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <label
                    className="text-white font-medium"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Pricing Options
                  </label>
                </div>
                <button
                  type="button"
                  onClick={addPricingCard}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-400/40 rounded-lg text-green-300 text-sm font-medium hover:bg-green-500/30 transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Pricing</span>
                </button>
              </div>

              <p
                className="text-white/60 text-sm mb-4"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Create different pricing tiers for your show (optional)
              </p>

              {pricingCards.length > 0 && (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {pricingCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-white/80 text-sm font-medium"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Pricing Option {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePricingCard(card.id)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Label */}
                        <div>
                          <label
                            className="block text-white/90 text-sm font-medium mb-1"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Label *
                          </label>
                          <input
                            type="text"
                            value={card.label}
                            onChange={(e) =>
                              updatePricingCard(card.id, {
                                label: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 text-sm"
                            placeholder="e.g., Basic, Premium, VIP"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label
                            className="block text-white/90 text-sm font-medium mb-1"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Description *
                          </label>
                          <textarea
                            value={card.description}
                            onChange={(e) =>
                              updatePricingCard(card.id, {
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 text-sm resize-none"
                            placeholder="Describe what's included in this pricing tier"
                            rows={2}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                        </div>

                        {/* Pricing */}
                        <div>
                          <label
                            className="block text-white/90 text-sm font-medium mb-1"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Price ($) *
                          </label>
                          <input
                            type="number"
                            value={card.pricing || ""}
                            onChange={(e) =>
                              updatePricingCard(card.id, {
                                pricing: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          />
                        </div>

                        {/* Included Services */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label
                              className="text-white/90 text-sm font-medium"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              Included Services
                            </label>
                            <button
                              type="button"
                              onClick={() => addServiceToPricingCard(card.id)}
                              className="text-green-400 hover:text-green-300 text-xs font-medium flex items-center space-x-1 transition-colors"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Service</span>
                            </button>
                          </div>
                          <div className="space-y-2">
                            {card.includedServices.map(
                              (service, serviceIndex) => (
                                <div
                                  key={serviceIndex}
                                  className="flex space-x-2"
                                >
                                  <input
                                    type="text"
                                    value={service}
                                    onChange={(e) =>
                                      updateServiceInPricingCard(
                                        card.id,
                                        serviceIndex,
                                        e.target.value
                                      )
                                    }
                                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 text-sm"
                                    placeholder="e.g., 2 Hosted Spaces, 1k Followers"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                  />
                                  {card.includedServices.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeServiceFromPricingCard(
                                          card.id,
                                          serviceIndex
                                        )
                                      }
                                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error message for this pricing card */}
                      {(errors[`pricing_${index}`] ||
                        errors[`pricing_services_${index}`]) && (
                        <p className="text-red-400 text-xs mt-2">
                          {errors[`pricing_${index}`] ||
                            errors[`pricing_services_${index}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {pricingCards.length > 0 && (
                <div className="mt-4">
                  <label
                    className="block text-white/90 text-sm font-medium mb-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Payout Address
                  </label>
                  <input
                    type="text"
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 text-sm"
                    placeholder="Enter payout address (0x...)"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <p
                    className="text-white/40 text-xs mt-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    This address is for the Ethereum network.
                  </p>
                </div>
              )}

              {pricingCards.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-white/20 rounded-lg">
                  <DollarSign className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p
                    className="text-white/60 text-sm"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    No pricing options added yet
                  </p>
                  <p
                    className="text-white/40 text-xs mt-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Click "Add Pricing" to create pricing tiers
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Scheduling...</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Success!</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Show</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
