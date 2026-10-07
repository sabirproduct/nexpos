import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, error, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // If we reach here, login succeeded - PrivateRoute will handle redirect
    } catch (err) {
      // Error is handled by AuthContext (setError)
      // Don't reset submitting immediately to give time for error to show
    }
    setSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-card animate-in">
        <div className="login-logo">🍽️</div>
        <h1 className="login-title">NexPOS</h1>
        <p className="login-subtitle">Restaurant Point of Sale</p>

        {error && (
          <div className="alert alert-error" style={{ fontSize: "12px", wordBreak: "break-word" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: "left" }}>
            <label>Email</label>
            <input
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group" style={{ textAlign: "left" }}>
            <label>Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || loading}
            className="btn btn-primary btn-block btn-lg"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--gray-400)" }}>
          Restaurant POS System
        </p>
      </div>
    </div>
  );
}
