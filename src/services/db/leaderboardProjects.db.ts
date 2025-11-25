import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase.service";

const LEADERBOARD_PROJECTS_COLLECTION = "leaderboard_projects";
export const getLbProjectByTwitterUsername = async (
  twitterUsername: string
) => {
  const q = query(
    collection(db, LEADERBOARD_PROJECTS_COLLECTION),
    where("twitterUsername", "==", twitterUsername.toLowerCase())
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as LeaderboardProject);
};

export interface ChartConfig {
  enabled: boolean;
  mode: string;
}

export interface LeaderboardProject {
  apiKey: string;
  cashtag: string;
  createdAt: number;
  customFormula: string;
  dailyChart: ChartConfig;
  enabled: boolean;
  flaggingEnabled: boolean;
  formulaType: string;
  hourlyChart: ChartConfig;
  includeReplyTweets: boolean;
  lastUpdateDateTime: Date | number;
  lastUpdatedAt: number;
  launchTimeInSeconds: number;
  monthlyChart: ChartConfig;
  projectId: string;
  searchQuery: string;
  startDateInSeconds: number;
  teamIgnoreList: string[];
  tweetBlockList: string[];
  twitterUsername: string;
  userIdsForUpdate: string[];
  weeklyChart: ChartConfig;
}

export interface LeaderboardProjectSnapshot {
  id?: string;
  createdAt: number;
  createdDateTime: string | Date;
  usersCount: number;
}

export const getLbProjectSnapshots = async (
  projectId: string,
  take: number = 50
) => {
  const projectRef = doc(db, LEADERBOARD_PROJECTS_COLLECTION, projectId);
  const snapshotsCollection = collection(projectRef, "snapshots");
  const q = query(
    snapshotsCollection,
    orderBy("createdAt", "desc"),
    limit(take)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((snapshotDoc) => ({
    id: snapshotDoc.id,
    ...(snapshotDoc.data() as LeaderboardProjectSnapshot),
  }));
};
