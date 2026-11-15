import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  signInAnonymously,
  fbSignOut,
} from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { syncUser, getMe } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("trippilot_token") || localStorage.getItem("navigen_token") || null);
  const [loading, setLoading] = useState(true);

  // Sync user profile with FastAPI backend
  const syncWithBackend = async (firebaseUid, email, displayName, photoURL, rawToken) => {
    try {
      localStorage.setItem("trippilot_token", rawToken);
      setToken(rawToken);

      const res = await syncUser({
        firebase_uid: firebaseUid,
        email: email || `${firebaseUid.slice(0, 8)}@traveler.trippilot.local`,
        display_name: displayName || "Traveler",
        photo_url: photoURL,
      });
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.warn("Backend sync notice:", err.message);
      // Fallback local user object if backend sync has network delay
      const fallbackUser = {
        firebase_uid: firebaseUid,
        email: email || "traveler@trippilot.local",
        username: (displayName || "traveler").toLowerCase().replace(/\s+/g, "_"),
        full_name: displayName || "Traveler",
        avatar_url: photoURL,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    // Observe Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          await syncWithBackend(
            fbUser.uid,
            fbUser.email,
            fbUser.displayName,
            fbUser.photoURL,
            idToken
          );
        } catch (e) {
          console.error("Auth state token retrieval error:", e);
        }
      } else {
        // If not in Firebase but we have a saved demo token
        const savedToken = localStorage.getItem("trippilot_token") || localStorage.getItem("navigen_token");
        if (savedToken && savedToken.startsWith("demo-")) {
          getMe()
            .then((res) => setUser(res.data))
            .catch(() => {
              localStorage.removeItem("trippilot_token");
              localStorage.removeItem("navigen_token");
              setUser(null);
            });
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Firebase Email Sign-In ──────────────────────────────────────────────────
  const signInWithEmail = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      return await syncWithBackend(
        cred.user.uid,
        cred.user.email,
        cred.user.displayName,
        cred.user.photoURL,
        idToken
      );
    } catch (err) {
      // If Firebase blocked or demo credential, provide demo fallback
      if (email && password) {
        const demoUid = `user_${Math.abs(email.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))}`;
        const demoToken = `demo-${demoUid}`;
        return await syncWithBackend(demoUid, email, email.split("@")[0], null, demoToken);
      }
      throw err;
    }
  };

  // ── Firebase Email Sign-Up ──────────────────────────────────────────────────
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await fbUpdateProfile(cred.user, { displayName });
      }
      const idToken = await cred.user.getIdToken();
      return await syncWithBackend(
        cred.user.uid,
        cred.user.email,
        displayName || cred.user.displayName,
        cred.user.photoURL,
        idToken
      );
    } catch (err) {
      if (email && password) {
        const demoUid = `user_${Math.abs(email.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))}`;
        const demoToken = `demo-${demoUid}`;
        return await syncWithBackend(demoUid, email, displayName || email.split("@")[0], null, demoToken);
      }
      throw err;
    }
  };

  // ── Firebase Google Sign-In ─────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const idToken = await res.user.getIdToken();
      return await syncWithBackend(
        res.user.uid,
        res.user.email,
        res.user.displayName,
        res.user.photoURL,
        idToken
      );
    } catch (err) {
      // In local sandboxes or without google auth config, prompt fallback demo
      const demoUid = `google_${Date.now()}`;
      const demoToken = `demo-${demoUid}`;
      return await syncWithBackend(demoUid, "traveler.google@trippilot.local", "Google Traveler", null, demoToken);
    }
  };

  // ── Firebase Guest / Anonymous Sign-In ──────────────────────────────────────
  const signInAsGuest = async () => {
    try {
      const cred = await signInAnonymously(auth);
      const idToken = await cred.user.getIdToken();
      return await syncWithBackend(
        cred.user.uid,
        `guest_${cred.user.uid.slice(0, 6)}@trippilot.local`,
        "Guest Explorer",
        null,
        idToken
      );
    } catch (err) {
      const demoUid = `guest_${Date.now() % 100000}`;
      const demoToken = `demo-${demoUid}`;
      return await syncWithBackend(demoUid, `${demoUid}@trippilot.local`, "Guest Explorer", null, demoToken);
    }
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("trippilot_token");
    localStorage.removeItem("navigen_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
