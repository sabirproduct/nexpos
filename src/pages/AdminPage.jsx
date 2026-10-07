import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getRestaurantSettings, updateRestaurantSettings, listenUsers, setUserRole as setUserRoleDB, deleteUserDoc } from "../utils/database";

const allNavItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/billing", label: "Billing", icon: "🧾" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
  { path: "/admin", label: "Admin", icon: "⚙️" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, refreshRole, createUser, isTrailer } = useAuth();
  const navItems = allNavItems.filter((item) => isTrailer() ? (item.path === "/" || item.path === "/billing" || item.path === "/menu") : true);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("trailer");
  const [creatingUser, setCreatingUser] = useState(false);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) { alert("Please enter email and password"); return; }
    if (newPassword.length < 6) { alert("Password must be at least 6 characters"); return; }
    setCreatingUser(true);
    try {
      await createUser(newEmail.trim(), newPassword, newRole);
      setNewEmail("");
      setNewPassword("");
      setNewRole("trailer");
      alert("User created successfully!");
    } catch (err) { alert("Error creating user: " + err.message); }
    setCreatingUser(false);
  };

  const handleApproveUser = async (uid) => {
    try { await setUserRoleDB(uid, { approved: true }); if (uid === user.uid) refreshRole(); }
    catch (err) { alert("Error: " + err.message); }
  };

  const handleRejectUser = async (uid) => {
    try { await setUserRoleDB(uid, { approved: false }); }
    catch (err) { alert("Error: " + err.message); }
  };

  const handleDeleteUser = async (uid) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try { await deleteUserDoc(uid); }
    catch (err) { alert("Error: " + err.message); }
  };

  const handleChangeRole = async (uid, role) => {
    try { await setUserRoleDB(uid, { role }); if (uid === user.uid) refreshRole(); }
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

        {/* Add New User */}
        <div className="card mt-4 animate-in">
          <h2 className="mb-3">Add New User</h2>
          <form onSubmit={handleCreateUser}>
            <div className="input-group">
              <label>Email</label>
              <input type="email" className="input" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Password (min 6 chars)</label>
              <input type="password" className="input" placeholder="Enter password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Role</label>
              <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="trailer">Trailer</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={creatingUser}>
              {creatingUser ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>

        {/* User Management */}
        <div className="card mt-4 animate-in">
          <h2 className="mb-3">User Management</h2>
          <p className="text-sm text-muted mb-3">Manage existing users. Approve, change roles, or remove users.</p>
          {users.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: "16px" }}>No users yet</div>
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
                  <div className="flex gap-1 flex-wrap" style={{ justifyContent: "flex-end" }}>
                    {u.approved !== true && <button className="btn btn-sm btn-secondary" onClick={() => handleApproveUser(u.uid)}>Approve</button>}
                    {u.approved !== false && u.uid !== user?.uid && <button className="btn btn-sm btn-danger" onClick={() => handleRejectUser(u.uid)}>Reject</button>}
                    {u.approved === true && u.role === "trailer" && <button className="btn btn-sm btn-primary" onClick={() => handleChangeRole(u.uid, "admin")}>Make Admin</button>}
                    {u.approved === true && u.role === "admin" && <button className="btn btn-sm btn-outline" onClick={() => handleChangeRole(u.uid, "trailer")}>Make Trailer</button>}
                    {u.uid !== user?.uid && <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.uid)} style={{ background: "#dc2626", color: "white" }}>Remove</button>}
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

