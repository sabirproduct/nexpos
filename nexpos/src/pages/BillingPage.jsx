import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOrder, updateOrder, listenOrders, listenMenuItems, getNextBillNumber, getNextOrderNumber } from "../utils/database";
import { printContent, generateKOTHtml, generateBillHtml, generateKOTAndBillHtml } from "../utils/print";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/billing", label: "Billing", icon: "🧾" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
];

export default function BillingPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tableNumber, setTableNumber] = useState("1");
  const [orderType, setOrderType] = useState("dinein");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubOrders = listenOrders((data) => setOrders(data));
    const unsubMenu = listenMenuItems((data) => setMenuItems(data));
    return () => { unsubOrders(); unsubMenu(); };
  }, []);

  const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing");

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === item.name);
      if (existing) {
        return prev.map((c) => c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { name: item.name, price: item.price || item.sellingPrice || 0, quantity: 1, image: item.image }];
    });
  };

  const updateQty = (name, delta) => {
    setCart((prev) => prev.map((c) => c.name === name ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const handleSubmitOrder = async () => {
    if (orderType === "dinein" && !tableNumber.trim()) { alert("Please enter a table number"); return; }
    if (cart.length === 0) { alert("Please add items to the order"); return; }
    setSaving(true);
    try {
      const { billNumber } = await getNextBillNumber();
      const { orderNumber } = await getNextOrderNumber();
      const orderData = {
        tableNumber: orderType === "dinein" ? tableNumber.trim() : "Parcel",
        items: [...cart],
        notes,
        status: "billed",
        type: "bill",
        orderType: orderType === "parcel" ? "parcel" : "dinein",
        billNumber,
        orderNumber,
        billedAt: Date.now(),
      };
      const saved = await saveOrder(orderData);
      printContent(generateKOTAndBillHtml(saved), "KOT & Bill");
      setCart([]);
      setNotes("");
      setTableNumber("1");
      setSaving(false);
    } catch (err) {
      alert("Error: " + err.message);
      setSaving(false);
    }
  };

  const markPreparing = (orderId) => updateOrder(orderId, { status: "preparing" });
  const markCompleted = (orderId) => updateOrder(orderId, { status: "completed" });

  const calc = (items) => {
    var sub = 0;
    if (items) { for (var i = 0; i < items.length; i++) { sub += (items[i].price || items[i].sellingPrice || 0) * (items[i].quantity || 1); } }
    return { subtotal: sub, tax: 0, total: sub };
  };

  const handleReprintKOT = (order) => {
    printContent(generateKOTHtml(order), "KOT Reprint");
  };

  const handleReprintBill = (order) => {
    printContent(generateBillHtml(order), "Bill Reprint");
  };

  const categories = [...new Set(menuItems.map((item) => item.category || "Other"))];

  return (
    <>
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>← Back</button>
        <h1>Billing</h1>
        <div />
      </div>

      <div className="page">
        {showForm && (
          <div className="card animate-in">
            <div className="card-header">
              <h2>New Order</h2>
              <div className="flex gap-2">
                <button className={`btn btn-sm ${orderType === "dinein" ? "btn-primary" : "btn-outline"}`} onClick={() => setOrderType("dinein")}>Table</button>
                <button className={`btn btn-sm ${orderType === "parcel" ? "btn-primary" : "btn-outline"}`} onClick={() => setOrderType("parcel")}>Parcel</button>
              </div>
            </div>

            {orderType === "dinein" && (
              <div className="input-group">
                <label>Table Number</label>
                <input type="text" className="input" placeholder="e.g. 5" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
              </div>
            )}

            {menuItems.length > 0 && (
              <>
                <label className="mb-2" style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-700)" }}>Select Items</label>
                {categories.map((cat) => (
                  <div key={cat} className="mb-3">
                    <h4 className="text-sm text-muted mb-2">{cat}</h4>
                    <div className="grid-2">
                      {menuItems.filter((item) => (item.category || "Other") === cat).map((item) => (
                        <div key={item.id} className="menu-item selected" onClick={() => addToCart(item)} style={{ cursor: "pointer" }}>
                          {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "8px 8px 0 0", marginBottom: "4px" }} />}
                          <div className="name">{item.name}</div>
                          <div className="price">₹{(item.price || item.sellingPrice || 0).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {cart.length > 0 && (
              <div className="card" style={{ marginTop: "8px", background: "#f8fafc" }}>
                <div className="card-header">
                  <h3>Cart ({cart.reduce((s, c) => s + c.quantity, 0)} items)</h3>
                  <span className="font-bold" style={{ color: "var(--secondary)" }}>₹{calc(cart).total.toFixed(2)}</span>
                </div>
                {cart.map((item) => (
                  <div key={item.name} className="flex justify-between items-center" style={{ padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
                    <span className="font-semibold" style={{ fontSize: "14px" }}>{item.name}</span>
                    <div className="flex items-center gap-2">
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
                <button className="btn btn-primary btn-block btn-lg mt-3" onClick={handleSubmitOrder} disabled={saving}>
                  {saving ? "Printing..." : "🧾 Print KOT & Bill"}
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
          <button className="btn btn-primary btn-block mb-3" onClick={() => setShowForm(true)}>+ New Order</button>
        )}

        <h2 className="mb-3 mt-4">Active Orders ({activeOrders.length})</h2>
        {activeOrders.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: "24px" }}>No active orders</div>
        ) : (
          activeOrders.map((order) => (
            <div key={order.id} className="kot-card">
              <div className="flex justify-between items-center mb-2">
                <h3>{order.orderType === "parcel" ? "📦 Parcel" : `Table ${order.tableNumber}`}</h3>
                <span className={`badge badge-${order.status}`}>{order.status}</span>
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
                <button className="btn btn-sm btn-outline" onClick={() => printContent(generateKOTHtml(order), "KOT Reprint")}>Reprint KOT</button>
              </div>
            </div>
          ))
        )}

        <h2 className="mb-3 mt-4">Recent Bills</h2>
        {orders.filter((o) => o.status === "billed").slice(-5).reverse().map((order) => {
          var t = calc(order.items).total;
          return (
            <div key={order.id} className="card" style={{ padding: "12px" }}>
              <div className="flex justify-between items-center">
                <div className="order-summary">
                  <span className="font-semibold">{order.orderType === "parcel" ? "📦 Parcel" : `Table ${order.tableNumber}`}</span>
                  <span className="text-xs text-muted">{order.billNumber || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-billed">Billed</span>
                  <span className="font-bold">₹{t.toFixed(2)}</span>
                  <button className="btn btn-sm btn-outline" onClick={() => handleReprintKOT(order)} style={{ fontSize: "10px", padding: "4px 6px" }}>KOT</button>
                  <button className="btn btn-sm btn-outline" onClick={() => handleReprintBill(order)} style={{ fontSize: "10px", padding: "4px 6px" }}>Bill</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)} className={`nav-item ${item.path === "/billing" ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
