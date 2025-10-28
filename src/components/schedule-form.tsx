"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import {
  X,
  Mic,
  Image,
  Clock,
  Calendar,
  Upload,
  Check,
  Link,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

interface Speaker {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  role: "regular" | "guest" | "unassigned";
}

interface ScheduledShow {
  id: string;
  showName: string;
  description: string;
  coverImage?: string;
  duration: number; // in minutes
  day: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // HH:MM format
  pattern: "one-time" | "specific-days" | "weekdays" | "daily";
  days?: number[]; // for specific-days pattern
  speakers?: Speaker[];
}

interface ScheduleFormProps {
  selectedSlots: { day: number; time: string }[];
  selectedPattern: "one-time" | "specific-days" | "weekdays" | "daily";
  onClose: () => void;
  onSubmit: (showData: Omit<ScheduledShow, "id">) => void;
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
    endDate: "",
    selectedDays: [] as number[],
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

    setIsFetchingSpeakers(true);
    setErrors((prev) => {
      const { previousSpaceUrl, ...rest } = prev;
      return rest;
    });

    try {
      // Simulate API call - In a real app, this would fetch from Twitter Spaces API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock data - simulating fetched speakers
      const mockSpeakers: Speaker[] = [
        {
          id: "1",
          name: "John Smith",
          handle: "@johnsmith",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=john`,
          role: "unassigned",
        },
        {
          id: "2",
          name: "Sarah Wilson",
          handle: "@sarahw",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=sarah`,
          role: "unassigned",
        },
        {
          id: "3",
          name: "Mike Chen",
          handle: "@mikechen",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mike`,
          role: "unassigned",
        },
      ];

      setSpeakers(mockSpeakers);
      setFetchSuccess(true);
      setTimeout(() => setFetchSuccess(false), 2000);
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
        speaker.id === speakerId ? { ...speaker, role } : speaker
      )
    );
  };

  const clearSpeakers = () => {
    setSpeakers([]);
    setFormData((prev) => ({ ...prev, previousSpaceUrl: "" }));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const showData: Omit<ScheduledShow, "id"> = {
      showName: formData.showName,
      description: formData.description,
      coverImage: formData.coverImage,
      duration: formData.duration,
      day: selectedSlots[0]?.day || 0,
      time: selectedSlots[0]?.time || "09:00",
      pattern: selectedPattern,
      days:
        selectedPattern === "specific-days" ? formData.selectedDays : undefined,
      speakers: speakers.length > 0 ? speakers : undefined,
    };

    setShowSuccess(true);

    setTimeout(() => {
      onSubmit(showData);
      setIsSubmitting(false);
      setShowSuccess(false);
    }, 1500);
  };

  const handleDayToggle = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }));
  };

  const formatTimeSlot = (day: number, time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${DAYS[day]} at ${displayHour}:${minutes} ${ampm}`;
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
            <div>
              <label
                className="block text-white font-medium mb-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Selected Time Slots
              </label>
              <div className="space-y-2">
                {selectedSlots.map((slot, index) => (
                  <div
                    key={`${slot.day}-${slot.time}`}
                    className="flex items-center space-x-2 p-3 bg-white/10 rounded-lg border border-white/20"
                  >
                    <Clock className="w-4 h-4 text-white/70" />
                    <span
                      className="text-white text-sm"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {formatTimeSlot(slot.day, slot.time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                Previous Space URL
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
                  placeholder="https://twitter.com/i/spaces/..."
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
                      key={speaker.id}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {speaker.avatar ? (
                          <img
                            src={speaker.avatar}
                            alt={speaker.name}
                            className="w-10 h-10 rounded-full bg-purple-500/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-300 text-sm font-medium">
                              {speaker.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p
                            className="text-white font-medium"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {speaker.name}
                          </p>
                          <p
                            className="text-white/60 text-sm"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            {speaker.handle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSpeakerRoleChange(speaker.id, "regular")
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
                            handleSpeakerRoleChange(speaker.id, "guest")
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
