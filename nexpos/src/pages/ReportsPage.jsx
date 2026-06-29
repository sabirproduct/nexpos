import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateDailyReport, generateRangeReport } from "../utils/database";
import { printContent, generateDailyReportHtml } from "../utils/print";
import { format, startOfWeek, startOfMonth, subDays, addDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/billing", label: "Billing", icon: "🧾" },
  { path: "/menu", label: "Menu", icon: "📋" },
  { path: "/reports", label: "Reports", icon: "📊" },
];

function getWeekRange(date) {
  var start = startOfWeek(date, { weekStartsOn: 1 });
  return { start: format(start, "yyyy-MM-dd"), end: format(addDays(start, 6), "yyyy-MM-dd") };
}

function getMonthRange(date) {
  var start = startOfMonth(date);
  var end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("daily");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rangeStart, setRangeStart] = useState(format(subDays(new Date(), 6), "yyyy-MM-dd"));
  const [rangeEnd, setRangeEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (tab === "daily") {
      fetchReport(selectedDate);
    } else {
      fetchRangeReport(rangeStart, rangeEnd);
    }
  }, [tab, selectedDate, rangeStart, rangeEnd]);

  var fetchReport = async function(date) {
    setLoading(true);
    try { var data = await generateDailyReport(date); setReport(data); }
    catch (err) { console.error("Error:", err); }
    setLoading(false);
  };

  var fetchRangeReport = async function(start, end) {
    setLoading(true);
    try { var data = await generateRangeReport(start, end); setReport(data); }
    catch (err) { console.error("Error:", err); }
    setLoading(false);
  };

  var handleSetWeek = function() {
    var r = getWeekRange(new Date());
    setRangeStart(r.start);
    setRangeEnd(r.end);
    setTab("weekly");
  };

  var handleSetMonth = function() {
    var r = getMonthRange(new Date());
    setRangeStart(r.start);
    setRangeEnd(r.end);
    setTab("monthly");
  };

  var handleSetYear = function() {
    var start = format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd");
    var end = format(new Date(), "yyyy-MM-dd");
    setRangeStart(start);
    setRangeEnd(end);
    setTab("yearly");
  };

  var handlePrintReport = function() {
    if (report) printContent(generateDailyReportHtml(report), tab.charAt(0).toUpperCase() + tab.slice(1) + " Report");
  };

  var isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <div className="top-bar">
        <button onClick={() => navigate("/")} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>← Back</button>
        <h1>Reports</h1>
        <div />
      </div>

      <div className="page">
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button className={`btn btn-sm ${tab === "daily" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("daily")}>Daily</button>
          <button className={`btn btn-sm ${tab === "weekly" ? "btn-primary" : "btn-outline"}`} onClick={handleSetWeek}>Weekly</button>
          <button className={`btn btn-sm ${tab === "monthly" ? "btn-primary" : "btn-outline"}`} onClick={handleSetMonth}>Monthly</button>
          <button className={`btn btn-sm ${tab === "yearly" ? "btn-primary" : "btn-outline"}`} onClick={handleSetYear}>Total</button>
        </div>

        {/* Date Selector */}
        <div className="card">
          {tab === "daily" ? (
            <div className="flex justify-between items-center">
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}>◀</button>
              <div className="text-center">
                <div className="font-bold">{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
                {isToday && <span className="badge badge-billed" style={{ marginTop: "4px" }}>Today</span>}
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => { var next = addDays(new Date(selectedDate), 1); if (next <= new Date()) setSelectedDate(format(next, "yyyy-MM-dd")); }} disabled={isToday}>▶</button>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-2">
              <div className="input-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: "11px" }}>From</label>
                <input type="date" className="input" style={{ fontSize: "12px", padding: "6px 8px" }} value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
              </div>
              <span style={{ marginTop: "16px" }}>→</span>
              <div className="input-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: "11px" }}>To</label>
                <input type="date" className="input" style={{ fontSize: "12px", padding: "6px 8px" }} value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {loading ? <div className="spinner" /> : !report ? <div className="card text-center text-muted" style={{ padding: "32px" }}>No data available</div> : (
          <div className="animate-in">
            {/* Summary */}
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

            {/* Chart for range reports */}
            {report.chartData && report.chartData.length > 0 && (
              <div className="card" style={{ padding: "12px" }}>
                <h3 className="mb-3">Sales Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" tickFormatter={(v) => "₹" + v} />
                    <Tooltip formatter={(value) => ["₹" + value.toFixed(2), "Sales"]} />
                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <h2 className="mb-3 mt-4">Items Sold</h2>
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
            ) : <div className="card text-center text-muted" style={{ padding: "24px" }}>No items sold</div>}

            <h2 className="mb-3 mt-4">Billed Orders</h2>
            {report.orders && report.orders.length > 0 ? (
              report.orders.slice(0, 20).map(function(order) {
                var sub = 0;
                if (order.items) { for (var i = 0; i < order.items.length; i++) { sub += (order.items[i].price || order.items[i].sellingPrice || 0) * order.items[i].quantity; } }
                var total = sub + sub * 0.05;
                return (
                  <div key={order.id} className="card" style={{ padding: "12px" }}>
                    <div className="flex justify-between items-center">
                      <div className="order-summary">
                        <span className="font-semibold">{order.orderType === "parcel" ? "📦 Parcel" : "Table " + (order.tableNumber || "N/A")}</span>
                        <span className="text-xs text-muted">{order.billNumber || (order.id || "").slice(-6).toUpperCase()}</span>
                      </div>
                      <span className="font-bold">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })
            ) : <div className="card text-center text-muted" style={{ padding: "24px" }}>No billed orders</div>}

            <button className="btn btn-primary btn-block btn-lg mt-4" onClick={handlePrintReport}>Print Report</button>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)} className={`nav-item ${item.path === "/reports" ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
