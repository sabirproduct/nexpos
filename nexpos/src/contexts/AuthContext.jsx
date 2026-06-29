import { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserRole, getAllUsers, setUserRole as setUserRoleDB } from "../utils/database";

const FIREBASE_API_KEY = "AIzaSyC3l3PGQ-FzMkE1aHdK4n7GBRz0GoLi1d8";
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Set persistence to LOCAL so session persists across browser restarts
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }, []);

  // On auth change: fetch role, auto-create admin for first user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          let role = await getUserRole(currentUser.uid);
          // Auto-create admin for FIRST user ever
          if (!role) {
            const allUsers = await getAllUsers();
            if (!allUsers || allUsers.length === 0) {
              await setUserRoleDB(currentUser.uid, {
                role: "admin",
                approved: true,
                email: currentUser.email,
                displayName: currentUser.displayName,
              });
              role = await getUserRole(currentUser.uid);
            } else {
              await setUserRoleDB(currentUser.uid, {
                role: "trailer",
                approved: false,
                email: currentUser.email,
                displayName: currentUser.displayName,
              });
            }
          }
          setUserRole(role);
        } catch (e) {
          console.error("Error fetching role:", e);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshRole = async () => {
    if (user) {
      try {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } catch (e) {
        console.error("Error refreshing role:", e);
      }
    }
  };

  const signIn = async (email, password) => {
    setError("");
    console.log("Attempting sign-in for:", email);
    try {
      // Add a timeout to detect hanging requests
      const result = await Promise.race([
        signInWithEmailAndPassword(auth, email, password),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000)),
      ]);
      console.log("Sign-in successful");
      return result;
    } catch (err) {
      var msg = err.message || String(err);
      console.error("Sign-in error:", msg);
      if (msg === "timeout") {
        msg = "Login request timed out. Check your internet connection and ensure Email/Password is enabled in Firebase Console.";
      } else if (msg.includes("auth/operation-not-allowed")) {
        msg = "Email/Password not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Email/Password.";
      } else if (msg.includes("auth/user-not-found") || msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
        msg = "Invalid email or password";
      } else if (msg.includes("auth/invalid-email")) {
        msg = "Invalid email format";
      } else if (msg.includes("auth/too-many-requests")) {
        msg = "Too many attempts. Please try again later.";
      } else if (msg.includes("auth/network-request-failed")) {
        msg = "Network error. Check your connection.";
      }
      setError(msg);
      throw err;
    }
  };

  const createUser = async (email, password, role) => {
    // Uses Firebase Auth REST API to create user without affecting current session
    const response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + FIREBASE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    // Create role document in Firestore for the new user
    await setUserRoleDB(data.localId, {
      role: role || "trailer",
      approved: true,
      email: email,
      displayName: email.split("@")[0],
    });
    return data;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  const isAdmin = () => !!(userRole && userRole.role === "admin" && userRole.approved === true);
  const isTrailer = () => !!(userRole && userRole.role === "trailer" && userRole.approved === true);
  const isApproved = () => {
    if (!userRole) return false;
    return userRole.approved === true;
  };

  const value = { user, userRole, loading, error, signIn, createUser, logout, refreshRole, isAdmin, isTrailer, isApproved };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
