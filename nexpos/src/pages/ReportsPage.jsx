import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateDailyReport } from "../utils/database";
import { printContent, generateDailyReportHtml } from "../utils/print";
import { format } from "date-fns";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/kot", label: "KOT", icon: "🧾" },
  { path: "/billing", label: "Billing", icon: "💳" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  var fetchReport = async function(date) {
    setLoading(true);
    try { var data = await generateDailyReport(date); setReport(data); }
    catch (err) { console.error("Error:", err); }
    setLoading(false);
  };

  useEffect(function() { fetchReport(selectedDate); }, [selectedDate]);

  var handlePrintReport = function() {
    if (report) printContent(generateDailyReportHtml(report), "Daily Report");
  };

  var handlePreviousDay = function() {
    var date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  var handleNextDay = function() {
    var date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    if (date <= new Date()) setSelectedDate(format(date, "yyyy-MM-dd"));
  };


  var isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>← Back</button>
        <h1>Daily Reports</h1>
        <div />
      </div>

      <div className="page">
        <div className="card">
          <div className="flex justify-between items-center">
            <button className="btn btn-sm btn-outline" onClick={handlePreviousDay}>◀</button>
            <div className="text-center">
              <div className="font-bold">{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
              {isToday && <span className="badge badge-billed" style={{ marginTop: "4px" }}>Today</span>}
            </div>
            <button className="btn btn-sm btn-outline" onClick={handleNextDay} disabled={isToday}>▶</button>
          </div>
        </div>

        {loading ? <div className="spinner" /> : !report ? <div className="card text-center text-muted" style={{ padding: "32px" }}>No data available</div> : (
          <div className="animate-in">
            <div className="grid-2">
              <div className="card" style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary)" }}>{report.totalOrders}</div>
                <div className="text-sm text-muted">Total Orders</div>
              </div>
              <div className="card" style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--secondary)" }}>₹{(report.totalSales || 0).toFixed(2)}</div>
                <div className="text-sm text-muted">Total Sales</div>
              </div>
            </div>

            <h2 className="mb-3 mt-4">Items Sold Today</h2>
            {report.items && report.items.length > 0 ? (
              <div className="card">
                {report.items.map(function(item, i) {
                  return (
                    <div key={i} className="order-item">
                      <div><span className="font-semibold">{item.name}</span><span className="text-sm text-muted"> x {item.quantity}</span></div>
                      <span className="font-bold">₹{(item.total || 0).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <div className="card text-center text-muted" style={{ padding: "24px" }}>No items sold on this day</div>}

            <h2 className="mb-3 mt-4">Billed Orders</h2>
            {report.orders && report.orders.length > 0 ? (
              report.orders.map(function(order) {
                var sub = 0;
                if (order.items) { for (var i = 0; i < order.items.length; i++) { sub += (order.items[i].price || order.items[i].sellingPrice || 0) * order.items[i].quantity; } }
                var total = sub + sub * 0.05;
                return (
                  <div key={order.id} className="card" style={{ padding: "12px" }}>
                    <div className="flex justify-between items-center">
                      <div className="order-summary">
                        <span className="font-semibold">Table {order.tableNumber}</span>
                        <span className="text-xs text-muted">{order.billNumber || (order.id || "").slice(-6).toUpperCase()}</span>
                      </div>
                      <span className="font-bold">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })
            ) : <div className="card text-center text-muted" style={{ padding: "24px" }}>No billed orders</div>}

            <button className="btn btn-primary btn-block btn-lg mt-4" onClick={handlePrintReport}>Print Daily Report</button>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        {navItems.map(function(item) {
          return (
            <button key={item.path} onClick={function() { navigate(item.path); }} className={"nav-item" + (item.path === "/reports" ? " active" : "")}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
