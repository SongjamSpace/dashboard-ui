import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../firebase.service";

export interface Transcription {
  id?: string;
  spaceUrl: string;
  title: string;
  userInfo: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    twitterUsername?: string;
  };
  createdAt: number;
  spaceData?: any;
  status?: "pending" | "completed" | "failed";
}

const TRANSCRIPTIONS_COLLECTION = "transcriptions";

export const createTranscription = async (
  data: Omit<Transcription, "id" | "createdAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, TRANSCRIPTIONS_COLLECTION), {
      ...data,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating transcription:", error);
    throw error;
  }
};

export const getTranscriptionsByUser = async (
  userId: string
): Promise<Transcription[]> => {
  try {
    const q = query(
      collection(db, TRANSCRIPTIONS_COLLECTION),
      where("userInfo.uid", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Transcription, "id">),
    }));
  } catch (error) {
    console.error("Error getting transcriptions by user:", error);
    throw error;
  }
};
