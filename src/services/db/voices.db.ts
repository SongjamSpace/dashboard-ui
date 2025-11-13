import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase.service";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const VOICES_COLLECTION = "voices";

export interface Voice {
  id: string;
  name: string;
  personality: string;
  audioUrl: string;
  storagePath: string;
  duration?: number;
  elevenLabsVoiceID?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateVoiceInput {
  name: string;
  personality: string;
  audioFile: File;
  duration?: number;
}

// Create a new voice document and upload audio
export const createVoice = async (input: CreateVoiceInput): Promise<string> => {
  try {
    // Create a new document reference first to get the ID
    const voicesColRef = collection(db, VOICES_COLLECTION);
    const newDocRef = doc(voicesColRef);
    const voiceId = newDocRef.id;

    // Upload audio file to Firebase Storage
    // Always save as .mp3 as requested (backend may need to handle conversion)
    const audioBlob = input.audioFile;
    const contentType = input.audioFile.type || "audio/mpeg";
    const storagePath = `voices/${voiceId}.mp3`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, audioBlob, { contentType });
    const audioUrl = await getDownloadURL(storageRef);

    // Create voice document in Firestore
    const now = Date.now();
    const voiceData: Omit<Voice, "id"> = {
      name: input.name,
      personality: input.personality,
      audioUrl,
      storagePath,
      duration: input.duration,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(newDocRef, voiceData);
    return voiceId;
  } catch (error) {
    console.error("Error creating voice:", error);
    throw error;
  }
};

// Get voice by ID
export const getVoiceById = async (voiceId: string): Promise<Voice | null> => {
  try {
    const docRef = doc(db, VOICES_COLLECTION, voiceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Voice;
  } catch (error) {
    console.error("Error getting voice:", error);
    throw error;
  }
};

// Get all voices
export const getAllVoices = async (): Promise<Voice[]> => {
  try {
    const q = query(
      collection(db, VOICES_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Voice)
    );
  } catch (error) {
    console.error("Error getting voices:", error);
    throw error;
  }
};

// Create a voice document with ElevenLabs voice ID (no storage upload)
export const createVoiceWithElevenLabsId = async (
  name: string,
  personality: string,
  elevenLabsVoiceID: string,
  duration?: number
): Promise<string> => {
  try {
    const voicesColRef = collection(db, VOICES_COLLECTION);
    const newDocRef = doc(voicesColRef);
    const voiceId = newDocRef.id;

    const now = Date.now();
    const voiceData: Omit<Voice, "id"> = {
      name,
      personality,
      audioUrl: "", // No storage upload
      storagePath: "", // No storage upload
      duration,
      elevenLabsVoiceID,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(newDocRef, voiceData);
    return voiceId;
  } catch (error) {
    console.error("Error creating voice with ElevenLabs ID:", error);
    throw error;
  }
};

// Update voice
export const updateVoice = async (
  voiceId: string,
  updates: Partial<Omit<Voice, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, VOICES_COLLECTION, voiceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error updating voice:", error);
    throw error;
  }
};

// Delete voice
export const deleteVoice = async (voiceId: string): Promise<void> => {
  try {
    const docRef = doc(db, VOICES_COLLECTION, voiceId);
    await deleteDoc(docRef);
    // Note: You might want to also delete the audio file from Storage
  } catch (error) {
    console.error("Error deleting voice:", error);
    throw error;
  }
};
