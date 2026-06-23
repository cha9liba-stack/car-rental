import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _auth: Auth | null = null;

if (isConfigured && !getApps().length) {
  try {
    _app = initializeApp(firebaseConfig);
    _db = getFirestore(_app);
    _storage = getStorage(_app);
    _auth = getAuth(_app);
  } catch (e) {
    console.warn("Firebase initialization failed:", e);
  }
} else if (isConfigured && getApps().length) {
  _app = getApps()[0];
  _db = getFirestore(_app);
  _storage = getStorage(_app);
  _auth = getAuth(_app);
}

export const db = _db as Firestore;
export const storage = _storage as FirebaseStorage;
export const auth = _auth as Auth;
export default _app;
