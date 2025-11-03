import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase.service";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const SHOWS_COLLECTION = "shows";
const SHOW_ANALYTICS_COLLECTION = "show_analytics";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Timezone helpers working with day/time (no dates)
const padTimeUnit = (value: number): string => String(value).padStart(2, "0");

const toDayName = (index: number): string => DAY_NAMES[((index % 7) + 7) % 7];

const normalizeDayIndex = (day?: number | string): number => {
  if (typeof day === "number" && Number.isFinite(day)) {
    const normalized = Math.round(day);
    return ((normalized % 7) + 7) % 7;
  }

  if (typeof day === "string") {
    const trimmed = day.trim().toLowerCase();
    let index = DAY_NAMES.findIndex((name) => name.toLowerCase() === trimmed);

    if (index !== -1) return index;

    index = DAY_NAMES.findIndex(
      (name) => name.slice(0, 3).toLowerCase() === trimmed.slice(0, 3)
    );

    if (index !== -1) return index;
  }

  return 0;
};

const getReferenceDateForLocalDay = (dayIndex: number): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (dayIndex + 7 - today.getDay()) % 7;
  const reference = new Date(today);
  reference.setDate(today.getDate() + diff);
  return reference;
};

const getReferenceDateForUtcDay = (utcDay: number | string): Date => {
  const utcDayIndex = normalizeDayIndex(utcDay);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diff = (utcDayIndex + 7 - today.getUTCDay()) % 7;
  const reference = new Date(today);
  reference.setUTCDate(today.getUTCDate() + diff);
  return reference;
};

const convertLocalDayTimeToUTC = (
  day: number | string | undefined,
  time: string
) => {
  const dayIndex = normalizeDayIndex(day);
  const reference = getReferenceDateForLocalDay(dayIndex);
  const [hoursStr = "0", minutesStr = "0"] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  const localDateTime = new Date(reference);
  localDateTime.setHours(hours, minutes, 0, 0);

  const utcDayIndex = localDateTime.getUTCDay();
  const utcTime = `${padTimeUnit(localDateTime.getUTCHours())}:${padTimeUnit(
    localDateTime.getUTCMinutes()
  )}`;

  return {
    dayIndex,
    dayName: toDayName(dayIndex),
    utcDayName: toDayName(utcDayIndex),
    utcTime,
  };
};

const convertUtcDayTimeToLocal = (
  utcDay: number | string | undefined,
  utcTime: string
) => {
  const utcDayIndex = normalizeDayIndex(utcDay);
  const reference = getReferenceDateForUtcDay(utcDay ?? utcDayIndex);
  const [hoursStr = "0", minutesStr = "0"] = utcTime.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  const utcDateTime = new Date(reference);
  utcDateTime.setUTCHours(hours, minutes, 0, 0);

  const dayIndex = utcDateTime.getDay();
  const time = `${padTimeUnit(utcDateTime.getHours())}:${padTimeUnit(
    utcDateTime.getMinutes()
  )}`;

  return {
    utcDayName: toDayName(utcDayIndex),
    dayIndex,
    dayName: toDayName(dayIndex),
    time,
  };
};

type ScheduleInput = {
  day?: number | string;
  /** legacy support for older persisted data */
  dayIndex?: number;
  time?: string;
  utcDay?: number | string;
  utcTime?: string;
  date?: string;
};

export interface ScheduleSlot {
  day: string;
  time: string;
  utcDay?: string;
  utcTime?: string;
}

const normalizeScheduleEntry = (
  entry: ScheduleInput | undefined
): ScheduleSlot => {
  const slot = entry ?? {};

  let time = typeof slot.time === "string" ? slot.time : undefined;
  let dayIndex: number | undefined =
    typeof slot.dayIndex === "number" && Number.isFinite(slot.dayIndex)
      ? normalizeDayIndex(slot.dayIndex)
      : undefined;

  if (slot.day !== undefined) {
    dayIndex = normalizeDayIndex(slot.day);
  }

  if (typeof slot.date === "string" && typeof slot.time === "string") {
    const localDate = new Date(`${slot.date}T${slot.time}:00`);
    dayIndex = localDate.getDay();
    time = `${padTimeUnit(localDate.getHours())}:${padTimeUnit(
      localDate.getMinutes()
    )}`;
  }

  if (typeof slot.utcTime === "string") {
    const utcSourceDay = slot.utcDay !== undefined ? slot.utcDay : undefined;

    if (dayIndex === undefined || !time) {
      const derived = convertUtcDayTimeToLocal(utcSourceDay, slot.utcTime);
      if (dayIndex === undefined) {
        dayIndex = derived.dayIndex;
      }
      if (!time) {
        time = derived.time;
      }
    }
  }

  if (dayIndex === undefined) {
    dayIndex = 0;
  }

  if (!time) {
    time = "00:00";
  }

  const { utcDayName, utcTime: normalizedUtcTime } = convertLocalDayTimeToUTC(
    dayIndex,
    time
  );

  return {
    day: toDayName(dayIndex),
    time,
    utcDay: utcDayName,
    utcTime: normalizedUtcTime,
  };
};

function convertScheduleToUTC(schedule: ScheduleInput[]): ScheduleSlot[] {
  return schedule.map((entry) => normalizeScheduleEntry(entry));
}

function convertScheduleFromUTCToLocal(
  schedule: ScheduleInput[] | undefined
): ScheduleSlot[] {
  if (!schedule) return [];
  return schedule.map((entry) => {
    // If we have UTC values, always convert them to viewer's local timezone
    // This ensures viewers see the correct time regardless of where they are
    if (
      entry &&
      typeof entry.utcTime === "string" &&
      entry.utcDay !== undefined
    ) {
      const converted = convertUtcDayTimeToLocal(entry.utcDay, entry.utcTime);
      return {
        day: converted.dayName,
        time: converted.time,
        utcDay: converted.utcDayName,
        utcTime: entry.utcTime,
      };
    }
    // Fallback to normalizeScheduleEntry for backward compatibility
    return normalizeScheduleEntry(entry);
  });
}

// User interface for show creators
export interface User {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

// Space metadata saved with a show
export interface SpaceHistoryMetadata {
  title?: string;
  mediaKey?: string;
  startedAt?: number;
  isSpaceAvailableForReplay?: boolean;
  totalReplayWatched?: number;
  totalLiveListeners?: number;
  tweetId?: string;
  spaceId: string;
  admins?: Array<{
    userId: string;
    displayName: string;
    twitterScreenName: string;
    avatarUrl?: string;
    isVerified?: boolean;
    admin?: boolean;
    speaker?: boolean;
  }>;
  speakers?: Array<{
    userId: string;
    displayName: string;
    twitterScreenName: string;
    avatarUrl?: string;
    isVerified?: boolean;
    admin?: boolean;
    speaker?: boolean;
  }>;
  [key: string]: unknown;
}

// Participant profile for shows
export interface ParticipantProfile {
  admin?: boolean;
  avatarUrl?: string;
  displayName?: string;
  isVerified?: boolean;
  role?: "regular" | "guest" | "unassigned";
  speaker?: boolean;
  twitterScreenName?: string; // handle without @
  userId: string;
}
export interface PricingCard {
  id: string;
  label: string;
  description: string;
  pricing: number;
  includedServices: string[];
}
// ScheduledShow interface based on the structure from components
export interface ScheduledShow {
  id?: string;
  showName: string;
  description: string;
  coverImage?: string;
  duration: number; // in minutes
  schedule: ScheduleSlot[];
  speakers?: {
    name: string;
    avatar?: string;
    role: "regular" | "guest" | "unassigned";
  }[];
  pricingCards?: PricingCard[];
  payoutAddress?: string;
  pricing?: {
    price: number;
    currency: string;
    details?: string;
  };
  status?: "live" | "viral" | "trending" | "upcoming" | "ended";
  participants?: ParticipantProfile[];
  spaceHistoryMetadata?: SpaceHistoryMetadata;
  spaceId?: string;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: User; // user object of the creator
  isActive?: boolean;
}

// Show Analytics interface
export interface ShowAnalytics {
  id?: string;
  showId: string;
  totalListeners: number;
  reach: {
    views: number;
    likes: number;
    replies: number;
    reposts: number;
  };
  engagement: {
    averageListenTime: number;
    peakListeners: number;
    completionRate: number;
  };
  demographics: {
    topCountries: string[];
    ageGroups: { range: string; percentage: number }[];
  };
  recordedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

// Show CRUD Operations
export const createShow = async (
  showData: Omit<ScheduledShow, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const showWithTimestamps: ScheduledShow = {
      ...showData,
      schedule: convertScheduleToUTC(showData.schedule),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    };

    const docRef = await addDoc(
      collection(db, SHOWS_COLLECTION),
      showWithTimestamps
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating show:", error);
    throw error;
  }
};

// Create a new ScheduledShow with user information
export const createScheduledShow = async (
  showData: Omit<ScheduledShow, "id" | "createdAt" | "updatedAt">,
  user: User
): Promise<string> => {
  try {
    // Create a new document reference first to get the ID
    const showsColRef = collection(db, SHOWS_COLLECTION);
    const newDocRef = doc(showsColRef);
    const newShowId = newDocRef.id;

    // Prepare cover image upload if provided (data URL string from form)
    let coverImageUrl: string | undefined = "";
    const inputCover = (showData as any).coverImage as string | undefined;

    if (typeof inputCover === "string" && inputCover.length > 0) {
      try {
        if (inputCover.startsWith("data:")) {
          const res = await fetch(inputCover);
          const blob = await res.blob();
          const storagePath = `shows/${newShowId}/cover`;
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, blob, { contentType: blob.type });
          coverImageUrl = await getDownloadURL(storageRef);
        } else {
          // Already a URL; just use it
          coverImageUrl = inputCover;
        }
      } catch (uploadErr) {
        console.error("Error uploading cover image:", uploadErr);
      }
    }

    const scheduledShowWithTimestamps: ScheduledShow = {
      ...(showData as any),
      schedule: convertScheduleToUTC(showData.schedule),
      coverImage: coverImageUrl,
      createdBy: user,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      status: showData.status || "upcoming",
    };

    await setDoc(newDocRef, scheduledShowWithTimestamps);
    return newShowId;
  } catch (error) {
    console.error("Error creating scheduled show:", error);
    throw error;
  }
};

export const getShowById = async (
  showId: string
): Promise<ScheduledShow | null> => {
  try {
    const docRef = doc(db, SHOWS_COLLECTION, showId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ScheduledShow;
      return {
        id: docSnap.id,
        ...data,
        schedule: convertScheduleFromUTCToLocal(data.schedule),
      } as ScheduledShow;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting show:", error);
    throw error;
  }
};

export const getAllShows = async (): Promise<ScheduledShow[]> => {
  try {
    const q = query(
      collection(db, SHOWS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as ScheduledShow;
      return {
        id: doc.id,
        ...data,
        schedule: convertScheduleFromUTCToLocal(data.schedule),
      } as ScheduledShow;
    });
  } catch (error) {
    console.error("Error getting shows:", error);
    throw error;
  }
};

export const getShowsByStatus = async (
  status: ScheduledShow["status"]
): Promise<ScheduledShow[]> => {
  try {
    const q = query(
      collection(db, SHOWS_COLLECTION),
      where("status", "==", status),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as ScheduledShow;
      return {
        id: doc.id,
        ...data,
        schedule: convertScheduleFromUTCToLocal(data.schedule),
      } as ScheduledShow;
    });
  } catch (error) {
    console.error("Error getting shows by status:", error);
    throw error;
  }
};

// Get scheduled shows by user (using the new User object structure)
export const getScheduledShowsByUser = async (
  userUid: string
): Promise<ScheduledShow[]> => {
  try {
    const q = query(
      collection(db, SHOWS_COLLECTION),
      where("createdBy.uid", "==", userUid),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as ScheduledShow;
      return {
        id: doc.id,
        ...data,
        schedule: convertScheduleFromUTCToLocal(data.schedule),
      } as ScheduledShow;
    });
  } catch (error) {
    console.error("Error getting scheduled shows by user:", error);
    throw error;
  }
};

export const updateShow = async (
  showId: string,
  updateData: Partial<Omit<ScheduledShow, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, SHOWS_COLLECTION, showId);
    const updateWithTimestamp = {
      ...updateData,
      ...(updateData.schedule
        ? { schedule: convertScheduleToUTC(updateData.schedule as any) }
        : {}),
      updatedAt: Date.now(),
    };

    await updateDoc(docRef, updateWithTimestamp);
  } catch (error) {
    console.error("Error updating show:", error);
    throw error;
  }
};

export const deleteShow = async (
  showId: string,
  softDelete: boolean = true
): Promise<void> => {
  try {
    const docRef = doc(db, SHOWS_COLLECTION, showId);

    if (softDelete) {
      // Soft delete by setting isActive to false
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: Date.now(),
      });
    } else {
      // Hard delete
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.error("Error deleting show:", error);
    throw error;
  }
};

// Show Analytics CRUD Operations
export const createShowAnalytics = async (
  analyticsData: Omit<ShowAnalytics, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const analyticsWithTimestamps: ShowAnalytics = {
      ...analyticsData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      recordedAt: Date.now(),
    };

    const docRef = await addDoc(
      collection(db, SHOW_ANALYTICS_COLLECTION),
      analyticsWithTimestamps
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating show analytics:", error);
    throw error;
  }
};

export const getShowAnalytics = async (
  showId: string
): Promise<ShowAnalytics | null> => {
  try {
    const q = query(
      collection(db, SHOW_ANALYTICS_COLLECTION),
      where("showId", "==", showId),
      orderBy("recordedAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ShowAnalytics;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting show analytics:", error);
    throw error;
  }
};

export const getAllShowAnalytics = async (
  showId: string
): Promise<ShowAnalytics[]> => {
  try {
    const q = query(
      collection(db, SHOW_ANALYTICS_COLLECTION),
      where("showId", "==", showId),
      orderBy("recordedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as ShowAnalytics)
    );
  } catch (error) {
    console.error("Error getting all show analytics:", error);
    throw error;
  }
};

export const updateShowAnalytics = async (
  analyticsId: string,
  updateData: Partial<Omit<ShowAnalytics, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, SHOW_ANALYTICS_COLLECTION, analyticsId);
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: Date.now(),
    };

    await updateDoc(docRef, updateWithTimestamp);
  } catch (error) {
    console.error("Error updating show analytics:", error);
    throw error;
  }
};

// Helper function to create multiple shows at once
export const createMultipleShows = async (
  showsData: Omit<ScheduledShow, "id" | "createdAt" | "updatedAt">[]
): Promise<string[]> => {
  try {
    const createPromises = showsData.map((showData) => createShow(showData));
    const showIds = await Promise.all(createPromises);
    return showIds;
  } catch (error) {
    console.error("Error creating multiple shows:", error);
    throw error;
  }
};

// Helper function to create shows (handles both single and multiple)
export const createShows = async (
  showData:
    | Omit<ScheduledShow, "id" | "createdAt" | "updatedAt">
    | Omit<ScheduledShow, "id" | "createdAt" | "updatedAt">[]
): Promise<string | string[]> => {
  if (Array.isArray(showData)) {
    return await createMultipleShows(showData);
  } else {
    return await createShow(showData);
  }
};

// Helper function to create a show document with validation
export const createShowDoc = async (showData: {
  showName: string;
  description: string;
  duration: number;
  schedule: Array<{ day?: string | number; time: string }>;
  coverImage?: string;
  participants?: ParticipantProfile[];
  spaceHistoryMetadata?: SpaceHistoryMetadata;
  spaceId?: string;
  createdBy?: User;
  status?: ScheduledShow["status"];
}): Promise<string> => {
  // Validate required fields
  if (
    !showData.showName ||
    !showData.description ||
    !showData.duration ||
    !showData.schedule ||
    showData.schedule.length === 0
  ) {
    throw new Error(
      "Missing required fields: showName, description, duration, and schedule are required"
    );
  }

  // Validate schedule entries
  for (const scheduleItem of showData.schedule) {
    const hasStringDay = typeof scheduleItem.day === "string";
    const hasNumericDay = typeof scheduleItem.day === "number";

    if (!hasStringDay && !hasNumericDay) {
      throw new Error(
        "Day must be provided as a weekday name or an index between 0 (Sunday) and 6 (Saturday)"
      );
    }

    if (hasStringDay) {
      const trimmed = (scheduleItem.day as string).trim();
      const lower = trimmed.toLowerCase();
      const matchesFull = DAY_NAMES.some(
        (name) => name.toLowerCase() === lower
      );
      const matchesShort = DAY_NAMES.some(
        (name) => name.slice(0, 3).toLowerCase() === lower.slice(0, 3)
      );

      if (!matchesFull && !matchesShort) {
        throw new Error(
          "Day must be a valid weekday name (e.g. Monday, Tue, etc.)"
        );
      }
    }

    if (hasNumericDay) {
      const numericDayValue = scheduleItem.day as number;
      if (
        Number.isNaN(numericDayValue) ||
        numericDayValue < 0 ||
        numericDayValue > 6
      ) {
        throw new Error(
          "Day index must be a number between 0 (Sunday) and 6 (Saturday)"
        );
      }
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleItem.time)) {
      throw new Error("Time must be in HH:MM format");
    }
  }

  // Validate duration (positive number)
  if (showData.duration <= 0) {
    throw new Error("Duration must be a positive number");
  }

  try {
    const showId = await createShow({
      ...showData,
      schedule: convertScheduleToUTC(showData.schedule),
      status: showData.status || "upcoming",
    });

    return showId;
  } catch (error) {
    console.error("Error creating show document:", error);
    throw error;
  }
};
