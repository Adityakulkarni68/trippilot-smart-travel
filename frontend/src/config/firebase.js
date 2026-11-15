/**
 * Firebase Configuration and Initialization
 * Supports real Firebase Auth projects via REACT_APP_FIREBASE_* environment variables,
 * and provides seamless guest/demo auth fallback for instant local testing.
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  signOut as fbSignOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDemoKeyForNavigenTravelPlatform2026",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "navigen-travel.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "navigen-travel",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "navigen-travel.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "100000000001",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:100000000001:web:abcdef1234567890",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  fbSignOut,
};
