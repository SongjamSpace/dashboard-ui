import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
} from "firebase/firestore";
import { db } from "../firebase.service";

const AUDIOFI_PROJECTS_COLLECTION = "audiofi_projects";

export interface AudioFiProjectSnapshot {
    count: number;
    createdAt: number;
}

export const getAudioFiProjectSnapshots = async (
    projectId: string,
    take: number = 50
) => {
    const projectRef = doc(db, AUDIOFI_PROJECTS_COLLECTION, projectId.toLocaleLowerCase());
    const snapshotsCollection = collection(projectRef, "snapshots");
    const q = query(
        snapshotsCollection,
        orderBy("createdAt", "desc"),
        limit(take)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((snapshotDoc) => ({
        ...(snapshotDoc.data() as AudioFiProjectSnapshot),
    }));
};
