import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { listenMenuItems, saveMenuItem } from "../utils/database";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/billing", label: "Billing", icon: "🧾" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
];

/**
 * Resize an image to 250x250 pixels using canvas
 */
function resizeImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    maxSize = maxSize || 250;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = maxSize;
        canvas.height = maxSize;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MenuPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [menuItems, setMenuItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Main Course");
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const unsub = listenMenuItems((data) => setMenuItems(data));
    return unsub;
  }, []);

  const handleFileSelect = async (e) => {
    var file = e.target.files[0];
    if (!file) return;
    try {
      var resized = await resizeImage(file, 250);
      setImagePreview(resized);
      setImageUrl(resized);
    } catch (err) {
      alert("Error processing image: " + err.message);
    }
  };

  const handleImageUrl = (e) => {
    var url = e.target.value.trim();
    setImageUrl(url);
    setImagePreview(url || null);
  };

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
        image: imageUrl || null,
      });
      setName("");
      setPrice("");
      setImagePreview(null);
      setImageUrl("");
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

            <div className="input-group">
              <label>Image (optional)</label>
              <input type="text" className="input" placeholder="Paste image URL from Google..." value={imageUrl} onChange={handleImageUrl} style={{ fontSize: "12px", marginBottom: "6px" }} />
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => fileInputRef.current.click()}>📁 Upload</button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
                {imagePreview && <button type="button" className="btn btn-sm btn-danger" onClick={() => { setImagePreview(null); setImageUrl(""); }}>Clear</button>}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "2px solid var(--gray-200)" }} />
                  <span className="text-xs text-muted" style={{ marginLeft: "8px" }}>250x250 px</span>
                </div>
              )}
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
                      {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "8px 8px 0 0", marginBottom: "4px" }} />}
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
