import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { db } from "../firebase.service";

export interface Campaign {
    id?: string;
    ctaType: string;
    ctaTarget: string;
    status: "DRAFT" | "ACTIVE" | "COMPLETED" | "PAUSED";
    spaceId: string;
    spaceTitle: string;
    projectId: string;
    userId: string;
    createdAt: number;
    description: string;
    isBroadcast: boolean;
    [key: string]: any;
}

const CAMPAIGNS_COLLECTION = "campaigns";

export const createCampaign = async (
    data: Omit<Campaign, "id">
): Promise<Campaign> => {
    try {
        const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), data);
        return { id: docRef.id, ...data } as Campaign;
    } catch (error) {
        console.error("Error creating campaign:", error);
        throw error;
    }
};

export const updateCampaign = async (
    campaignId: string,
    data: Partial<Campaign>
): Promise<void> => {
    try {
        const docRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating campaign:", error);
        throw error;
    }
};

export const getCampaign = async (
    campaignId: string,
    callback?: (campaign: Campaign | null) => void
): Promise<Campaign | null> => {
    try {
        const docRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const campaign = { id: docSnap.id, ...docSnap.data() } as Campaign;
            if (callback) callback(campaign);
            return campaign;
        } else {
            if (callback) callback(null);
            return null;
        }
    } catch (error) {
        console.error("Error getting campaign:", error);
        throw error;
    }
};
