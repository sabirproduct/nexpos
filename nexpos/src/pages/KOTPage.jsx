import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOrder, updateOrder, listenOrders, listenMenuItems } from "../utils/database";
import { printContent, generateKOTHtml } from "../utils/print";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/kot", label: "KOT", icon: "🧾" },
  { path: "/billing", label: "Billing", icon: "💳" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
];

export default function KOTPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubOrders = listenOrders((data) => setOrders(data));
    const unsubMenu = listenMenuItems((data) => setMenuItems(data));
    return () => { unsubOrders(); unsubMenu(); };
  }, []);

  const activeKOTs = orders.filter((o) => o.status === "pending" || o.status === "preparing");

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === item.name);
      if (existing) {
        return prev.map((c) => c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { name: item.name, price: item.price || item.sellingPrice || 0, quantity: 1 }];
    });
  };

  const updateQty = (name, delta) => {
    setCart((prev) => prev.map((c) => c.name === name ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const handleSendKOT = async () => {
    if (!tableNumber.trim()) { alert("Please enter a table number"); return; }
    if (cart.length === 0) { alert("Please add items to the order"); return; }
    setSaving(true);
    try {
      const orderData = { tableNumber: tableNumber.trim(), items: [...cart], notes, status: "pending", type: "kot" };
      const saved = await saveOrder(orderData);
      printContent(generateKOTHtml(saved), "KOT");
      setCart([]);
      setNotes("");
      setSaving(false);
    } catch (err) {
      alert("Error: " + err.message);
      setSaving(false);
    }
  };

  const markPreparing = (orderId) => updateOrder(orderId, { status: "preparing" });

  return (
    <>
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>← Back</button>
        <h1>Kitchen Order Ticket</h1>
        <div />
      </div>

      <div className="page">
        {showForm && (
          <div className="card animate-in">
            <div className="card-header">
              <h2>New Order</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowForm(false)}>Show KOTs</button>
            </div>
            <div className="input-group">
              <label>Table Number</label>
              <input type="text" className="input" placeholder="e.g. 5, 10, 12" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
            </div>
            {menuItems.length > 0 && (
              <>
                <label className="mb-2" style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-700)" }}>Select Items</label>
                <div className="grid-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="menu-item" onClick={() => addToCart(item)}>
                      <div className="name">{item.name}</div>
                      <div className="price">₹{(item.price || item.sellingPrice || 0).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {cart.length > 0 && (
              <div className="card" style={{ marginTop: "12px", padding: "12px" }}>
                <h3 className="mb-2">Cart</h3>
                {cart.map((item) => (
                  <div key={item.name} className="order-item">
                    <div><span className="font-semibold">{item.name}</span><span className="text-sm text-muted"> x {item.quantity}</span></div>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-sm" style={{ background: "var(--gray-200)", padding: "2px 8px" }} onClick={() => updateQty(item.name, -1)}>-</button>
                      <span className="font-bold" style={{ minWidth: "24px", textAlign: "center" }}>{item.quantity}</span>
                      <button className="btn btn-sm" style={{ background: "var(--gray-200)", padding: "2px 8px" }} onClick={() => updateQty(item.name, 1)}>+</button>
                    </div>
                  </div>
                ))}
                <div className="input-group" style={{ marginTop: "8px" }}>
                  <label>Special Notes</label>
                  <input type="text" className="input" placeholder="Any special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-block mt-2" onClick={handleSendKOT} disabled={saving}>
                  {saving ? "Sending..." : "Send to Kitchen & Print KOT"}
                </button>
              </div>
            )}
            {cart.length === 0 && menuItems.length === 0 && (
              <div className="text-center text-muted" style={{ padding: "16px" }}>Add menu items from the Menu page first</div>
            )}
            {cart.length === 0 && menuItems.length > 0 && (
              <div className="text-center text-muted" style={{ padding: "16px" }}>Tap items above to add to order</div>
            )}
          </div>
        )}

        {!showForm && (
          <button className="btn btn-primary btn-block mb-3" onClick={() => setShowForm(true)}>+ New KOT</button>
        )}

        <h2 className="mb-3">Active KOTs ({activeKOTs.length})</h2>
        {activeKOTs.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: "24px" }}>No active KOTs</div>
        ) : (
          activeKOTs.map((order) => (
            <div key={order.id} className={"kot-card" + (order.status === "completed" ? " completed" : "")}>
              <div className="flex justify-between items-center mb-2">
                <h3>Table {order.tableNumber}</h3>
                <span className={"badge badge-" + order.status}>{order.status}</span>
              </div>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between" style={{ fontSize: "14px", margin: "4px 0" }}>
                  <span>{item.name}</span>
                  <span className="font-bold">x{item.quantity}</span>
                </div>
              ))}
              {order.notes && <p className="text-sm text-muted mt-2" style={{ fontStyle: "italic" }}>Notes: {order.notes}</p>}
              <div className="flex gap-2 mt-3">
                {order.status === "pending" && <button className="btn btn-sm btn-warning" onClick={() => markPreparing(order.id)}>Start Preparing</button>}
                {order.status === "preparing" && <button className="btn btn-sm btn-secondary" onClick={() => markCompleted(order.id)}>Mark Completed</button>}
                <button className="btn btn-sm btn-outline" onClick={() => printContent(generateKOTHtml(order), "KOT Reprint")}>Reprint</button>
              </div>
            </div>
          ))
        )}
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)} className={"nav-item" + (item.path === "/kot" ? " active" : "")}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

  const markCompleted = (orderId) => updateOrder(orderId, { status: "completed" });
