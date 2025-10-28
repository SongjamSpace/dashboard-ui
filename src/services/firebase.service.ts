// Import the functions you need from the SDKs you need
// import { getStripePayments } from "@stripe/firestore-stripe-payments";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
// import { getStripePayments } from "@invertase/firestore-stripe-payments";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize analytics only on client side
let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// const payments = getStripePayments(app, {
//   productsCollection: "products",
//   customersCollection: "customers",
// });
// logFirebaseEvent("select_content", {
//   content_type: "spotifyArtistId",
//   content_id: spotifyArtistId,
// });

const logFirebaseEvent = (
  type:
    | "login"
    | "purchase"
    | "select_content"
    | "sign_up"
    | "space_limit_reached"
    | "analyze_broadcast"
    | "analyze_space"
    | "dm_limit_reached",
  additionalParams: any
) => {
  if (analytics) {
    logEvent(analytics, type as any, additionalParams);
  }
};

export { app, db, storage, auth, logFirebaseEvent };
