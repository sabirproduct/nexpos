import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenOrders, updateOrder } from "../utils/database";
import { printContent, generateBillHtml } from "../utils/print";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/kot", label: "KOT", icon: "🧾" },
  { path: "/billing", label: "Billing", icon: "💳" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
];

export default function BillingPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTable, setSearchTable] = useState("");

  useEffect(() => {
    const unsub = listenOrders((data) => setOrders(data));
    return unsub;
  }, []);

  const billableOrders = orders.filter(
    (o) => (o.status === "completed" || o.status === "pending" || o.status === "preparing") && o.type !== "billed"
  );

  const filteredOrders = searchTable
    ? billableOrders.filter((o) => o.tableNumber && o.tableNumber.toString().includes(searchTable))
    : billableOrders;

  const calc = (items) => {
    var sub = 0;
    if (items) { for (var i = 0; i < items.length; i++) { sub += (items[i].price || items[i].sellingPrice || 0) * (items[i].quantity || 1); } }
    var tax = Math.round(sub * 0.05 * 100) / 100;
    return { subtotal: sub, tax: tax, total: sub + tax };
  };

  const handleGenerateBill = async () => {
    if (!selectedOrder) return;
    try {
      var billNum = "BILL-" + Date.now().toString(36).toUpperCase();
      await updateOrder(selectedOrder.id, { status: "billed", billNumber: billNum, billedAt: Date.now() });
      var billData = Object.assign({}, selectedOrder, { status: "billed", billNumber: billNum });
      printContent(generateBillHtml(billData), "Bill");
      setSelectedOrder(null);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleReprint = (order) => {
    var data = Object.assign({}, order, { billNumber: order.billNumber || ("BILL-" + (order.id || "").slice(-6).toUpperCase()) });
    printContent(generateBillHtml(data), "Bill Reprint");

  return (
    <>
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>← Back</button>
        <h1>Billing</h1>
        <div />
      </div>

      <div className="page">
        <div className="input-group">
          <label>Search by Table</label>
          <input type="text" className="input" placeholder="Enter table number..." value={searchTable} onChange={(e) => setSearchTable(e.target.value)} />
        </div>

        <h2 className="mb-3">Orders Ready for Billing ({filteredOrders.length})</h2>
        {filteredOrders.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: "24px" }}>No orders ready for billing</div>
        ) : (
          filteredOrders.map((order) => {
            var t = calc(order.items).total;
            return (
              <div key={order.id} className="card" onClick={() => setSelectedOrder(order)} style={{ cursor: "pointer", border: (selectedOrder && selectedOrder.id === order.id) ? "2px solid var(--primary)" : "2px solid transparent", background: (selectedOrder && selectedOrder.id === order.id) ? "#eff6ff" : "white" }}>
                <div className="flex justify-between items-center mb-2">
                  <div><span className="font-bold" style={{ fontSize: "16px" }}>Table {order.tableNumber}</span><span className="badge badge-completed" style={{ marginLeft: "8px" }}>{order.status}</span></div>
                  <span className="font-bold" style={{ fontSize: "18px", color: "var(--secondary)" }}>₹{t.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted">{order.items.map(function(it) { return it.name; }).join(", ")}</div>
                <div className="text-xs text-muted mt-1">Items: {order.items.reduce(function(s, i) { return s + i.quantity; }, 0)} | Time: {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            );
          })
        )}

        {selectedOrder && (
          <div className="card animate-in" style={{ marginTop: "16px", border: "2px solid var(--primary)" }}>
            <div className="card-header">
              <h2>Table {selectedOrder.tableNumber}</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedOrder(null)}>Clear</button>
            </div>
            {selectedOrder.items.map(function(item, i) {
              return (
                <div key={i} className="order-item">
                  <div><span className="font-semibold">{item.name}</span><span className="text-sm text-muted"> x {item.quantity}</span></div>
                  <span className="font-bold">₹{((item.price || item.sellingPrice || 0) * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--gray-200)", marginTop: "8px", paddingTop: "8px" }}>
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{calc(selectedOrder.items).subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Tax (5%)</span><span>₹{calc(selectedOrder.items).tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold" style={{ fontSize: "18px", marginTop: "8px" }}><span>Total</span><span style={{ color: "var(--secondary)" }}>₹{calc(selectedOrder.items).total.toFixed(2)}</span></div>
            </div>
            <button className="btn btn-secondary btn-block btn-lg mt-3" onClick={handleGenerateBill}>Generate Bill & Print</button>
          </div>
        )}

        <h2 className="mb-3 mt-4">Recent Bills</h2>
        {orders.filter(function(o) { return o.status === "billed"; }).slice(-5).reverse().map(function(order) {
          var t = calc(order.items).total;
          return (
            <div key={order.id} className="card" style={{ padding: "12px" }}>
              <div className="flex justify-between items-center">
                <div className="order-summary">
                  <span className="font-semibold">Table {order.tableNumber}</span>
                  <span className="text-xs text-muted">{order.billNumber || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-billed">Billed</span>
                  <span className="font-bold">₹{t.toFixed(2)}</span>
                  <button className="btn btn-sm btn-outline" onClick={function() { handleReprint(order); }}>Print</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <nav className="bottom-nav">
        {navItems.map(function(item) {
          return (
            <button key={item.path} onClick={function() { navigate(item.path); }} className={"nav-item" + (item.path === "/billing" ? " active" : "")}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

  };
