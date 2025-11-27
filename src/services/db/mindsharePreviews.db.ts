import { addDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase.service";

const MINDSHARE_PREVIEWS_COLLECTION = "mindshare_previews";

export interface MindsharePreview {
    cashtag: string;
    startFrom: string;
    startDateInSeconds: number;
    twitterUsername: string;
    status: "NEW" | "PROCESSING" | "ENDED";
    user: {
        username: string;
        name: string;
        uid: string;
    };
    createdAt?: number;
}

export const createMindsharePreview = async (preview: MindsharePreview) => {
    try {
        const docRef = await addDoc(collection(db, MINDSHARE_PREVIEWS_COLLECTION), {
            ...preview,
            createdAt: Date.now(),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getMindsharePreviewByUid = async (uid: string) => {
    try {
        const q = query(
            collection(db, MINDSHARE_PREVIEWS_COLLECTION),
            where("user.uid", "==", uid),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }
        return null;
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
    }
};
