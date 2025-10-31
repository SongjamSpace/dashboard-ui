import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase.service";
import type { ScheduledShow } from "./shows.db";

const SHOW_BOOKINGS_COLLECTION = "showBookings";

export interface ShowBookingUser {
  uid?: string | null;
  twitterId: string;
  twitterHandle?: string | null;
  displayName?: string | null;
}

export interface ShowBooking {
  id: string;
  showId: string;
  tierLabel: string;
  show: {
    id?: string | null;
    name: string;
    coverImage?: string | null;
    duration: number;
    schedule: ScheduledShow["schedule"];
    status?: ScheduledShow["status"] | null;
  };
  user: ShowBookingUser;
  createdAt: number;
  updatedAt: number;
}

export interface CreateShowBookingInput {
  show: ScheduledShow;
  tierLabel: string;
  user: ShowBookingUser;
}

export const getShowBookingId = (showId: string, twitterId: string): string =>
  `${showId}_${twitterId}`;

export const getShowBooking = async (
  showId: string,
  twitterId: string
): Promise<ShowBooking | null> => {
  if (!showId || !twitterId) {
    return null;
  }

  try {
    const bookingId = getShowBookingId(showId, twitterId);
    const docRef = doc(db, SHOW_BOOKINGS_COLLECTION, bookingId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      showId: data.showId,
      tierLabel: data.tierLabel,
      show: data.show,
      user: data.user,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as ShowBooking;
  } catch (error) {
    console.error("Error getting show booking", error);
    throw error;
  }
};

export const createShowBooking = async (
  input: CreateShowBookingInput
): Promise<ShowBooking> => {
  const { show, tierLabel, user } = input;

  if (!show?.id) {
    throw new Error("Show ID is required to create a booking");
  }

  if (!user?.twitterId) {
    throw new Error("Twitter ID is required to create a booking");
  }

  try {
    const bookingId = getShowBookingId(show.id, user.twitterId);
    const docRef = doc(db, SHOW_BOOKINGS_COLLECTION, bookingId);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      const data = existing.data();
      return {
        id: existing.id,
        showId: data.showId,
        tierLabel: data.tierLabel,
        show: data.show,
        user: data.user,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as ShowBooking;
    }

    const now = Date.now();
    const payload: Omit<ShowBooking, "id"> = {
      showId: show.id,
      tierLabel,
      show: {
        id: show.id ?? null,
        name: show.showName,
        coverImage: show.coverImage ?? null,
        duration: show.duration,
        schedule: show.schedule,
        status: show.status ?? null,
      },
      user: {
        uid: user.uid ?? null,
        twitterId: user.twitterId,
        twitterHandle: user.twitterHandle ?? null,
        displayName: user.displayName ?? null,
      },
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, payload, { merge: false });

    return {
      id: bookingId,
      ...payload,
    };
  } catch (error) {
    console.error("Error creating show booking", error);
    throw error;
  }
};
