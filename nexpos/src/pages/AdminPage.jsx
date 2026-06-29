import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getRestaurantSettings, updateRestaurantSettings, listenUsers, setUserRole } from "../utils/database";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/billing", label: "Billing", icon: "🧾" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
  { path: "/admin", label: "Admin", icon: "⚙️" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, refreshRole } = useAuth();
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getRestaurantSettings().then((settings) => {
      setRestaurantName(settings.name || "");
      setRestaurantAddress(settings.address || "");
      setRestaurantPhone(settings.phone || "");
    });
    const unsub = listenUsers((data) => setUsers(data));
    return unsub;
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRestaurantSettings({ name: restaurantName, address: restaurantAddress, phone: restaurantPhone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert("Error saving: " + err.message); }
    setSaving(false);
  };

  const handleApproveUser = async (uid, role) => {
    try { await setUserRole(uid, { role: role || "trailer", approved: true }); if (uid === user.uid) refreshRole(); }
    catch (err) { alert("Error: " + err.message); }
  };

  const handleRejectUser = async (uid) => {
    try { await setUserRole(uid, { role: "trailer", approved: false }); }
    catch (err) { alert("Error: " + err.message); }
  };

  const handleChangeRole = async (uid, role) => {
    try { await setUserRole(uid, { role }); if (uid === user.uid) refreshRole(); }
    catch (err) { alert("Error: " + err.message); }
  };

  return (
    <>
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>← Back</button>
        <h1>Admin</h1>
        <div />
      </div>
      <div className="page">
        <div className="card animate-in">
          <h2 className="mb-3">Restaurant Settings</h2>
          <form onSubmit={handleSaveSettings}>
            <div className="input-group">
              <label>Restaurant Name</label>
              <input type="text" className="input" placeholder="e.g. My Restaurant" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Address</label>
              <input type="text" className="input" placeholder="Restaurant address" value={restaurantAddress} onChange={(e) => setRestaurantAddress(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input type="text" className="input" placeholder="Phone number" value={restaurantPhone} onChange={(e) => setRestaurantPhone(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
              {saving ? "Saving..." : saved ? "✅ Saved!" : "Save Settings"}
            </button>
          </form>
        </div>

        <div className="card mt-4 animate-in">
          <h2 className="mb-3">User Management</h2>
          <p className="text-sm text-muted mb-3">Approve or reject users who sign in. Set their role (Admin or Trailer).</p>
          {users.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: "16px" }}>No users yet. Users will appear here after they sign in.</div>
          ) : (
            users.map((u) => (
              <div key={u.uid} className="card" style={{ padding: "12px", marginBottom: "8px", background: "#f8fafc" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{u.displayName || u.email || u.uid}</div>
                    <div className="text-xs text-muted">
                      Role: <strong>{u.role || "pending"}</strong>
                      {u.approved === true ? " | ✅ Approved" : u.approved === false ? " | ❌ Rejected" : " | ⏳ Pending"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {u.approved !== true && <button className="btn btn-sm btn-secondary" onClick={() => handleApproveUser(u.uid, "trailer")}>Approve</button>}
                    {u.approved === true && u.role === "trailer" && <button className="btn btn-sm btn-primary" onClick={() => handleChangeRole(u.uid, "admin")}>Make Admin</button>}
                    {u.approved === true && u.role === "admin" && <button className="btn btn-sm btn-outline" onClick={() => handleChangeRole(u.uid, "trailer")}>Make Trailer</button>}
                    {u.approved !== false && u.uid !== user?.uid && <button className="btn btn-sm btn-danger" onClick={() => handleRejectUser(u.uid)}>Reject</button>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)} className={`nav-item ${item.path === "/admin" ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

