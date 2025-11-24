import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase.service";

export interface SnapJob {
    id?: string;
    userId: string;
    searchQuery: string;
    profilesCount: number;
    tweetsCount?: number;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    createdAt: number;
    updatedAt?: number;
    error?: string;
    lastCursor?: string;
    [key: string]: any;
}

const SNAP_JOBS_COLLECTION = "snap_jobs";

export const getSnapJobsByUserId = async (
    userId: string
): Promise<SnapJob[]> => {
    try {
        const q = query(
            collection(db, SNAP_JOBS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<SnapJob, "id">),
        })) as SnapJob[];
    } catch (error) {
        console.error("Error getting snap jobs by user:", error);
        throw error;
    }
};

export const getSnapListenerById = (
    snapId: string,
    onUpdate: (snap: SnapJob | null) => void
) => {
    const docRef = doc(db, SNAP_JOBS_COLLECTION, snapId);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            onUpdate({ id: doc.id, ...(doc.data() as any) } as SnapJob);
        } else {
            onUpdate(null);
        }
    });
};
