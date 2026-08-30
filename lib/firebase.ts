import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCiMGUhfhGaU5BKxp3P4-bpWGBMnOmkM44",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "armia-f5b0d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "armia-f5b0d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "armia-f5b0d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1035500204008",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1035500204008:web:37bd9c2a4ded81108dbe5d"
};

// Initialize Firebase safely for SSR/Client
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider, firebaseConfig };
