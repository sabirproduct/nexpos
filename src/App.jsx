import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BillingPage from "./pages/BillingPage";
import ReportsPage from "./pages/ReportsPage";
import MenuPage from "./pages/MenuPage";
import AdminPage from "./pages/AdminPage";

function PrivateRoute({ children }) {
  const { user, loading, isApproved } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" />;
  if (isApproved() === false) {
    return (
      <div className="login-page">
        <div className="login-card animate-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <h2>Pending Approval</h2>
          <p style={{ color: "var(--gray-500)", margin: "12px 0" }}>
            Your account is pending approval from the administrator.
          </p>
          <p style={{ fontSize: "12px", color: "var(--gray-400)" }}>
            Please contact the admin to approve your access.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin, userRole } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" />;
  // Allow access if admin, OR if no users exist yet (first setup)
  if (isAdmin()) return children;
  return <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <PrivateRoute>
                <BillingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <ReportsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <PrivateRoute>
                <MenuPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
