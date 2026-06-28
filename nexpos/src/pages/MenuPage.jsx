import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenMenuItems, saveMenuItem } from "../utils/database";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/kot", label: "KOT", icon: "🧾" },
  { path: "/billing", label: "Billing", icon: "💳" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
];

export default function MenuPage() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Main Course");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = listenMenuItems((data) => setMenuItems(data));
    return unsub;
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      alert("Please enter item name and price");
      return;
    }

    setSaving(true);
    try {
      await saveMenuItem({
        name: name.trim(),
        price: parseFloat(price),
        sellingPrice: parseFloat(price),
        category,
      });
      setName("");
      setPrice("");
      setSaving(false);
    } catch (err) {
      alert("Error saving item: " + err.message);
      setSaving(false);
    }
  };

  const categories = [...new Set(menuItems.map((item) => item.category || "Other"))];

  return (
    <>
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>← Back</button>
        <h1>Menu Items</h1>
        <div />
      </div>

      <div className="page">
        <div className="card animate-in">
          <h2 className="mb-3">Add Menu Item</h2>
          <form onSubmit={handleAddItem}>
            <div className="input-group">
              <label>Item Name</label>
              <input type="text" className="input" placeholder="e.g. Butter Chicken" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Price (₹)</label>
              <input type="number" className="input" placeholder="e.g. 299" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" />
            </div>
            <div className="input-group">
              <label>Category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Main Course">Main Course</option>
                <option value="Starters">Starters</option>
                <option value="Beverages">Beverages</option>
                <option value="Desserts">Desserts</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
              {saving ? "Adding..." : "Add Item"}
            </button>
          </form>
        </div>

        <h2 className="mb-3 mt-4">Menu Items ({menuItems.length})</h2>

        {menuItems.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: "24px" }}>No menu items yet</div>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="mb-3">
              <h3 className="mb-2">{cat}</h3>
              <div className="grid-2">
                {menuItems
                  .filter((item) => (item.category || "Other") === cat)
                  .map((item) => (
                    <div key={item.id} className="menu-item selected">
                      <div className="name">{item.name}</div>
                      <div className="price">₹{(item.price || item.sellingPrice || 0).toFixed(2)}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)} className={`nav-item ${item.path === "/menu" ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
