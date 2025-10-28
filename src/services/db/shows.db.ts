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
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase.service";

const SHOWS_COLLECTION = "shows";
const SHOW_ANALYTICS_COLLECTION = "show_analytics";

// Show interface based on the structure from shows page
export interface Show {
  id?: string;
  showName: string;
  description: string;
  coverImage?: string;
  duration: number; // in minutes
  day: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // HH:MM format
  pattern: "one-time" | "specific-days" | "weekdays" | "daily";
  days?: number[]; // for specific-days pattern
  startDate?: string; // for one-time shows
  endDate?: string; // for recurring shows
  status?: "live" | "viral" | "trending" | "upcoming" | "ended";
  participants?: string[]; // profile image URLs or user IDs
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string; // user ID of the creator
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
  recordedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Show CRUD Operations
export const createShow = async (
  showData: Omit<Show, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const showWithTimestamps: Show = {
      ...showData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
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

export const getShowById = async (showId: string): Promise<Show | null> => {
  try {
    const docRef = doc(db, SHOWS_COLLECTION, showId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Show;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting show:", error);
    throw error;
  }
};

export const getAllShows = async (): Promise<Show[]> => {
  try {
    const q = query(
      collection(db, SHOWS_COLLECTION),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Show)
    );
  } catch (error) {
    console.error("Error getting shows:", error);
    throw error;
  }
};

export const getShowsByStatus = async (
  status: Show["status"]
): Promise<Show[]> => {
  try {
    const q = query(
      collection(db, SHOWS_COLLECTION),
      where("status", "==", status),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Show)
    );
  } catch (error) {
    console.error("Error getting shows by status:", error);
    throw error;
  }
};

export const getShowsByCreator = async (creatorId: string): Promise<Show[]> => {
  try {
    const q = query(
      collection(db, SHOWS_COLLECTION),
      where("createdBy", "==", creatorId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Show)
    );
  } catch (error) {
    console.error("Error getting shows by creator:", error);
    throw error;
  }
};

export const updateShow = async (
  showId: string,
  updateData: Partial<Omit<Show, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, SHOWS_COLLECTION, showId);
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: Timestamp.now(),
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
        updatedAt: Timestamp.now(),
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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      recordedAt: Timestamp.now(),
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
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, updateWithTimestamp);
  } catch (error) {
    console.error("Error updating show analytics:", error);
    throw error;
  }
};

// Helper function to create multiple shows at once
export const createMultipleShows = async (
  showsData: Omit<Show, "id" | "createdAt" | "updatedAt">[]
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
    | Omit<Show, "id" | "createdAt" | "updatedAt">
    | Omit<Show, "id" | "createdAt" | "updatedAt">[]
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
  day: number;
  time: string;
  pattern: Show["pattern"];
  days?: number[];
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  participants?: string[];
  createdBy?: string;
  status?: Show["status"];
}): Promise<string> => {
  // Validate required fields
  if (
    !showData.showName ||
    !showData.description ||
    !showData.duration ||
    showData.day === undefined ||
    !showData.time ||
    !showData.pattern
  ) {
    throw new Error(
      "Missing required fields: showName, description, duration, day, time, and pattern are required"
    );
  }

  // Validate day (0-6 for Sunday-Saturday)
  if (showData.day < 0 || showData.day > 6) {
    throw new Error("Day must be between 0 (Sunday) and 6 (Saturday)");
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(showData.time)) {
    throw new Error("Time must be in HH:MM format");
  }

  // Validate duration (positive number)
  if (showData.duration <= 0) {
    throw new Error("Duration must be a positive number");
  }

  try {
    const showId = await createShow({
      ...showData,
      status: showData.status || "upcoming",
    });

    return showId;
  } catch (error) {
    console.error("Error creating show document:", error);
    throw error;
  }
};
