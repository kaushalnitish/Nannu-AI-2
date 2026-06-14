import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  userProfile: any | null;
  syncProfileData: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Monitor Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch/create profile in Firestore
        await fetchOrCreateProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchOrCreateProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        // Initialize new cloud profile
        const initialProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Anonymous Creator",
          createdAt: new Date().toISOString(),
          voiceSettings: {
            vocabulary: "Executive SaaS & Startup",
            baseEnergy: "Dynamic Speech",
            voiceSyncScore: 92,
            lastTrained: "Last trained just now",
            selectedTones: ["Excited 🔥", "Friendly 🤝"]
          },
          hiddenPreferences: {}
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (err) {
      console.error("Failed to fetch or create user profile in Firestore:", err);
      // Fallback local state if DB connection has temporary offline block
    }
  };

  const syncProfileData = async (updatedFields: any) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      const currentSnap = await getDoc(userDocRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};
      const merged = {
        ...currentData,
        ...updatedFields,
        uid: user.uid,
        email: user.email || currentData.email || ""
      };
      await setDoc(userDocRef, merged);
      setUserProfile(merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Popup sign in failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error("Sign out process failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser, userProfile, syncProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
