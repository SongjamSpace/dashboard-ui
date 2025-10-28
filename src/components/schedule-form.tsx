"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { X, Mic, Image, Clock, Calendar, Upload, Check } from "lucide-react";

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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
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

            {/* Specific Days Selection */}
            {selectedPattern === "specific-days" && (
              <div>
                <label
                  className="block text-white font-medium mb-3"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Select Days *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.selectedDays.includes(index)
                          ? "bg-purple-500/20 border-purple-400/50 text-white"
                          : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30"
                      }`}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {day}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.selectedDays && (
                  <p className="text-red-400 text-sm mt-2">
                    {errors.selectedDays}
                  </p>
                )}
              </div>
            )}

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
