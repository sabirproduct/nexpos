import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { listenOrders, listenMenuItems } from "../utils/database";

const allNavItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/billing", label: "Billing", icon: "🧾" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
  { path: "/admin", label: "Admin", icon: "⚙️" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isTrailer } = useAuth();
  const navItems = allNavItems.filter((item) => isTrailer() ? (item.path === "/" || item.path === "/billing" || item.path === "/menu") : true);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const unsubOrders = listenOrders((data) => setOrders(data));
    const unsubMenu = listenMenuItems((data) => setMenuItems(data));
    return () => {
      unsubOrders();
      unsubMenu();
    };
  }, []);

  const todaysBills = orders.filter((o) => {
    const today = new Date().toISOString().split("T")[0];
    return o.status === "billed" && o.date === today;
  });

  const stats = [
    { label: "Today's Bills", value: todaysBills.length, color: "#059669" },
    { label: "Menu Items", value: menuItems.length, color: "#7c3aed" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <h1>NexPOS - Powered by Nexbizion Systems</h1>
        <div className="flex items-center gap-2">
          <span className="user-info">
            {user?.displayName || user?.email?.split("@")[0]}
          </span>
          <button onClick={logout} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="page">
        <div className="animate-in">
          {/* Stats Grid */}
          <div className="grid-2" style={{ marginBottom: "16px" }}>
            {stats.map((stat, i) => (
              <div className="card" key={i} style={{ textAlign: "center", padding: "20px 12px" }}>
                <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted" style={{ marginTop: "4px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <h2 className="mb-3">Quick Actions</h2>
          <div className="grid-2">
            <button
              onClick={() => navigate("/billing")}
              className="btn btn-primary btn-block"
              style={{ padding: "20px", fontSize: "16px", flexDirection: "column", gap: "8px" }}
            >
              <span style={{ fontSize: "28px" }}>🧾</span>
              New Billing
            </button>
            <button
              onClick={() => navigate("/menu")}
              className="btn btn-secondary btn-block"
              style={{ padding: "20px", fontSize: "16px", flexDirection: "column", gap: "8px" }}
            >
              <span style={{ fontSize: "28px" }}>📋</span>
              Menu
            </button>
          </div>

          {/* Recent Orders */}
          <h2 className="mb-3 mt-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="card text-center text-muted" style={{ padding: "32px" }}>
              No orders yet
            </div>
          ) : (
            orders.slice(-5).reverse().map((order) => {
              const total = order.items.reduce(
                (s, item) => s + (item.price || item.sellingPrice || 0) * item.quantity,
                0
              );
              return (
                <div className="card" key={order.id} style={{ padding: "12px" }}>
                  <div className="flex justify-between items-center">
                    <div className="order-summary">
                      <span className="font-semibold">
                        Table {order.tableNumber || "N/A"}
                      </span>
                      <span className="text-xs text-muted">
                        {(order.createdAt?.toDate
                          ? order.createdAt.toDate()
                          : new Date(order.createdAt || Date.now())
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" "}• {order.items?.length || 0} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${order.status}`}>{order.status}</span>
                      <span className="font-bold">₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
