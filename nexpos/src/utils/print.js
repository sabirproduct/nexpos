/**
 * Print utility for 58mm thermal printers.
 * Uses a popup window for clean thermal printer output.
 */

export function printContent(htmlContent, title) {
  var printWindow = window.open("", title || "Print", "width=400,height=600");
  if (!printWindow) {
    alert("Please allow pop-ups to print.");
    return;
  }

  var style = [
    "@page { size: 58mm auto; margin: 0; }",
    "* { margin: 0; padding: 0; box-sizing: border-box; }",
    "body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; padding: 2mm 3mm; color: #000; }",
    ".header { text-align: center; margin-bottom: 6px; border-bottom: 1px dashed #000; padding-bottom: 6px; }",
    ".header h2 { font-size: 16px; font-weight: bold; text-transform: uppercase; }",
    ".header p { font-size: 10px; margin: 2px 0; }",
    ".divider { border-top: 1px dashed #000; margin: 6px 0; }",
    ".item { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }",
    ".item .name { flex: 1; }",
    ".item .qty { width: 30px; text-align: center; }",
    ".item .price { width: 60px; text-align: right; }",
    ".totals { margin-top: 6px; border-top: 1px dashed #000; padding-top: 6px; }",
    ".total-line { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }",
    ".total-line.final { font-size: 16px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }",
    ".footer { text-align: center; margin-top: 8px; font-size: 10px; border-top: 1px dashed #000; padding-top: 6px; }",
    ".text-center { text-align: center; }",
    ".text-right { text-align: right; }",
    ".bold { font-weight: bold; }",
    "@media print { body { width: 58mm; } }",
  ].join("\n");

  var html = "<!DOCTYPE html><html><head><title>" + (title || "Print") + "</title><style>" + style + "</style></head><body>"
    + htmlContent
    + "<script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)};</script>"
    + "</body></html>";

  printWindow.document.write(html);
  printWindow.document.close();
}


function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderItems(items) {
  if (!items || items.length === 0) return "";
  var result = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var qty = item.quantity || 1;
    var price = item.price || item.sellingPrice || 0;
    result += '<div class="item">'
      + '<span class="name">' + escapeHtml(item.name) + '</span>'
      + '<span class="qty">x' + qty + '</span>'
      + '<span class="price">₹' + (price * qty).toFixed(2) + '</span>'
      + '</div>';
  }
  return result;
}

export function generateKOTHtml(order) {
  var now = new Date();
  var timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  var orderNumber = escapeHtml(order.orderNumber || order.orderId || (order.id && order.id.slice(-6).toUpperCase()) || "N/A");
  var orderType = order.orderType === "parcel" ? "PARCEL" : "DINE-IN";
  var tableInfo = order.orderType === "parcel" ? "Parcel" : "Table: " + escapeHtml(order.tableNumber || "N/A");
  var itemsHtml = "";
  if (order.items) {
    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];
      itemsHtml += '<div class="item">'
        + '<span class="name">' + escapeHtml(item.name) + '</span>'
        + '<span class="qty">x' + (item.quantity || 1) + '</span>'
        + '</div>';
    }
  }
  return '<div class="header">'
    + '<h2>KITCHEN ORDER</h2>'
    + '<p>' + orderType + ' | ' + tableInfo + '</p>'
    + '<p style="font-size:14px; font-weight:bold;">Order #: ' + orderNumber + '</p>'
    + '<p>Time: ' + timeStr + '</p>'
    + '</div>'
    + '<div class="divider"></div>'
    + itemsHtml
    + '<div class="divider"></div>'
    + '<p class="text-center bold">*** SPECIAL INSTRUCTIONS ***</p>'
    + '<p class="text-center" style="font-size:10px;">' + escapeHtml(order.notes || "N/A") + '</p>'
    + '<div class="footer"><p>Thank You</p></div>';
}

export function generateBillHtml(order, restaurantName) {
  restaurantName = restaurantName || "NexPOS Restaurant";
  var now = new Date();
  var dateStr = now.toLocaleDateString("en-IN");
  var timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  var orderNumber = escapeHtml(order.orderNumber || order.orderId || (order.id && order.id.slice(-6).toUpperCase()) || "N/A");
  var billNo = escapeHtml(order.billNumber || order.orderId || (order.id && order.id.slice(-6).toUpperCase()) || "N/A");
  var subtotal = 0;
  if (order.items) {
    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];
      subtotal += (item.price || item.sellingPrice || 0) * (item.quantity || 1);
    }
  }
  var total = subtotal;
  var orderType = order.orderType === "parcel" ? "PARCEL" : "DINE-IN";
  var tableInfo = order.orderType === "parcel" ? "Parcel Order" : "Table: " + escapeHtml(order.tableNumber || "N/A");
  return '<div class="header">'
    + '<h2>' + escapeHtml(restaurantName) + '</h2>'
    + '<p>' + dateStr + ' ' + timeStr + '</p>'
    + '<p>' + orderType + ' | ' + tableInfo + '</p>'
    + '<p style="font-size:14px; font-weight:bold;">Order #: ' + orderNumber + '</p>'
    + '<p>Bill #: ' + billNo + '</p>'
    + '</div>'
    + '<div class="divider"></div>'
    + renderItems(order.items)
    + '<div class="totals">'
    + '<div class="total-line final"><span>TOTAL</span><span>₹' + total.toFixed(2) + '</span></div>'
    + '</div>'
    + '<div class="footer"><p>Thank You! Visit Again!</p></div>';
}

/**
 * Generate KOT and Bill on the same page with a cut marker
 */
export function generateKOTAndBillHtml(order, restaurantName) {
  restaurantName = restaurantName || "NexPOS Restaurant";
  var now = new Date();
  var dateStr = now.toLocaleDateString("en-IN");
  var timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  var orderNumber = escapeHtml(order.orderNumber || order.orderId || (order.id && order.id.slice(-6).toUpperCase()) || "N/A");
  var billNo = escapeHtml(order.billNumber || order.orderId || (order.id && order.id.slice(-6).toUpperCase()) || "N/A");
  var orderType = order.orderType === "parcel" ? "PARCEL" : "DINE-IN";
  var tableInfo = order.orderType === "parcel" ? "Parcel" : "Table: " + escapeHtml(order.tableNumber || "N/A");

  // KOT items (no prices)
  var kotItemsHtml = "";
  if (order.items) {
    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];
      kotItemsHtml += '<div class="item">'
        + '<span class="name">' + escapeHtml(item.name) + '</span>'
        + '<span class="qty">x' + (item.quantity || 1) + '</span>'
        + '</div>';
    }
  }

  // Bill items (with prices)
  var subtotal = 0;
  var billItemsHtml = "";
  if (order.items) {
    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];
      var qty = item.quantity || 1;
      var price = item.price || item.sellingPrice || 0;
      subtotal += price * qty;
      billItemsHtml += '<div class="item">'
        + '<span class="name">' + escapeHtml(item.name) + '</span>'
        + '<span class="qty">x' + qty + '</span>'
        + '<span class="price">₹' + (price * qty).toFixed(2) + '</span>'
        + '</div>';
    }
  }

  // === KOT Section ===
  var kotSection = '<div class="header">'
    + '<h2>KITCHEN ORDER</h2>'
    + '<p>' + orderType + ' | ' + tableInfo + '</p>'
    + '<p style="font-size:14px; font-weight:bold;">Order #: ' + orderNumber + '</p>'
    + '<p>Time: ' + timeStr + '</p>'
    + '</div>'
    + '<div class="divider"></div>'
    + kotItemsHtml
    + '<div class="divider"></div>'
    + '<p class="text-center bold">*** SPECIAL INSTRUCTIONS ***</p>'
    + '<p class="text-center" style="font-size:10px;">' + escapeHtml(order.notes || "N/A") + '</p>'
    + '<div class="footer"><p>Kitchen Copy</p></div>';

  // === Cut Marker ===
  var cutMarker = '<div style="text-align: center; margin: 12px 0; font-size: 14px; letter-spacing: 4px;">'
    + '- - - - - - - - - - - - - - - - - - - - -'
    + '</div>'
    + '<div style="text-align: center; font-size: 10px; color: #666; margin-bottom: 8px;">✂ CUT HERE ✂</div>';

  // === Bill Section ===
  var billSection = '<div class="header">'
    + '<h2>' + escapeHtml(restaurantName) + '</h2>'
    + '<p>' + dateStr + ' ' + timeStr + '</p>'
    + '<p>' + orderType + ' | ' + tableInfo + '</p>'
    + '<p style="font-size:14px; font-weight:bold;">Order #: ' + orderNumber + '</p>'
    + '<p>Bill #: ' + billNo + '</p>'
    + '</div>'
    + '<div class="divider"></div>'
    + billItemsHtml
    + '<div class="totals">'
    + '<div class="total-line final"><span>TOTAL</span><span>₹' + subtotal.toFixed(2) + '</span></div>'
    + '</div>'
    + '<div class="footer"><p>Thank You! Visit Again!</p></div>';

  return kotSection + cutMarker + billSection;
}

export function generateDailyReportHtml(report) {
  var date = report.date ? new Date(report.date) : new Date();
  var dateStr = date.toLocaleDateString("en-IN");
  var items = report.items || [];
  var itemsHtml = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    itemsHtml += '<div class="item">'
      + '<span class="name">' + escapeHtml(item.name) + '</span>'
      + '<span class="qty">x' + (item.quantity || 0) + '</span>'
      + '<span class="price">₹' + (item.total || 0).toFixed(2) + '</span>'
      + '</div>';
  }
  if (!itemsHtml) {
    itemsHtml = '<p class="text-center" style="font-size:10px;">No items sold</p>';
  }
  return '<div class="header">'
    + '<h2>DAILY SALES REPORT</h2>'
    + '<p>' + dateStr + '</p>'
    + '</div>'
    + '<div class="divider"></div>'
    + '<div class="total-line"><span>Total Orders</span><span>' + (report.totalOrders || 0) + '</span></div>'
    + '<div class="total-line final"><span>Total Sales</span><span>₹' + (report.totalSales || 0).toFixed(2) + '</span></div>'
    + '<div class="divider"></div>'
    + '<p class="bold text-center">ITEMS SOLD</p>'
    + itemsHtml
    + '<div class="footer"><p>- End of Report -</p></div>';
}
