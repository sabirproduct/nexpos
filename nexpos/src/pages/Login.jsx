import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { signInWithGoogle, error, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  const handleLogin = async () => {
    setRedirecting(true);
    await signInWithGoogle();
    // If redirect doesn't happen (e.g. error), allow retry
    setRedirecting(false);
  };

  if (redirecting) {
    return (
      <div className="login-page">
        <div className="login-card animate-in" style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p style={{ marginTop: "16px", color: "var(--gray-600)" }}>Redirecting to Google...</p>
          <p style={{ fontSize: "12px", color: "var(--gray-400)", marginTop: "8px" }}>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card animate-in">
        <div className="login-logo">🍽️</div>
        <h1 className="login-title">NexPOS</h1>
        <p className="login-subtitle">Restaurant Point of Sale</p>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary btn-block btn-lg"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          Sign in with Google
        </button>

        <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--gray-400)" }}>
          You'll be redirected to Google to sign in
        </p>
      </div>
    </div>
  );
}
