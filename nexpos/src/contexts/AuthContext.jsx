import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { auth, provider } from "../firebase/config";
import { getUserRole } from "../utils/database";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const role = await getUserRole(currentUser.uid);
          setUserRole(role);
        } catch (e) {
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
      const role = await getUserRole(user.uid);
      setUserRole(role);
    }
  };

  const signInWithGoogle = async () => {
    setError("");
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      setError(err.message);
    }
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
    // No role doc = new user = allow through (admin must set role)
    if (!userRole) return true;
    // Has role doc but rejected = block
    return userRole.approved === true;
  };

  const value = { user, userRole, loading, error, signInWithGoogle, logout, refreshRole, isAdmin, isTrailer, isApproved };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
