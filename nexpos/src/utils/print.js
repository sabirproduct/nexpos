/**
 * Print utility for 58mm thermal printers.
 * Uses a popup window for clean thermal printer output.
 */

export function printContent(htmlContent, title, targetWindow) {
  // Remove any previous print style (from <head> - React doesn't manage this)
  var oldStyle = document.getElementById("nexpos-print-style");
  if (oldStyle) oldStyle.parentNode.removeChild(oldStyle);

  var styles = [
    "@page { size: 58mm auto; margin: 0; }",
    "html, body { width: 100%; min-height: 100%; margin: 0; padding: 0; }",
    "* { margin: 0; padding: 0; box-sizing: border-box; }",
    "body { font-family: monospace; font-size: 12px; width: 58mm; max-width: 100%; margin: 0 auto; padding: 2mm 2mm; color: #000; background: #fff; line-height: 1.2; }",
    ".header { text-align: center; margin-bottom: 4px; border-bottom: 1px dashed #000; padding-bottom: 4px; }",
    ".header h2 { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: normal; text-transform: uppercase; }",
    ".header p { font-size: 10px; margin: 1px 0; }",
    ".divider { border-top: 1px dashed #000; margin: 4px 0; }",
    ".item { display: flex; justify-content: space-between; align-items: flex-start; font-size: 11px; margin: 1px 0; gap: 2px; }",
    ".item .name { flex: 1 1 auto; min-width: 0; word-break: break-word; white-space: normal; }",
    ".item .qty, .item .price { flex-shrink: 0; }",
    ".item .qty { width: 30px; text-align: center; }",
    ".item .price { width: 58px; text-align: right; }",
    ".totals { margin-top: 4px; border-top: 1px dashed #000; padding-top: 4px; }",
    ".total-line { display: flex; justify-content: space-between; font-size: 12px; margin: 1px 0; }",
    ".total-line.final { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: normal; border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }",
    ".footer { text-align: center; margin-top: 6px; font-size: 10px; border-top: 1px dashed #000; padding-top: 4px; }",
    ".text-center { text-align: center; }",
    ".text-right { text-align: right; }",
    ".bold { }",
    ".print-toolbar { position: sticky; top: 0; z-index: 100; width: 100%; background: #fff; padding: 10px 12px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; gap: 10px; box-sizing: border-box; }",
    ".print-toolbar p { margin: 0; font-size: 12px; color: #333; }",
    ".print-button { display: inline-flex; align-items: center; justify-content: center; padding: 10px 14px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; text-transform: uppercase; }",
    ".print-button:active { opacity: 0.9; transform: translateY(1px); }",
    "@media print {",
    "  .print-toolbar { display: none !important; }",
    "  html, body { width: 58mm; min-height: auto; margin: 0; padding: 0; }",
    "  body { width: 58mm; padding: 1.5mm 2mm; margin: 0; font-family: monospace; }",
    "  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }",
    "}",
  ].join("\n");

  var fullHtml = [
    "<!DOCTYPE html><html>",
    "<head><meta charset='utf-8'>",
    "<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1'>",
    "<title>" + (title || "Print") + "</title>",
    "<style>" + styles + "</style>",
    "</head>",
    "<body>",
    "<div class='print-toolbar'><p>Tap PRINT to send to your mobile printer app.</p><button class='print-button' id='nexpos-print-btn' type='button'>Print</button></div>",
    htmlContent,
    "<script>window.onload=function(){ var btn=document.getElementById('nexpos-print-btn'); if(btn){ btn.addEventListener('click', function(event){ event.preventDefault(); window.print(); }); } };<\/script>",
    "</body></html>"
  ].join("\n");

  var printWindow = targetWindow && !targetWindow.closed ? targetWindow : window.open("", "_blank", "width=600,height=800,scrollbars=yes");
  if (printWindow) {
    try {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
      if (typeof printWindow.print === "function") {
        try { printWindow.print(); } catch (printError) {}
      }
    } catch (err) {
      printWindow = null;
    }
  }

  if (!printWindow) {
    var style = document.createElement("style");
    style.id = "nexpos-print-style";
    style.textContent = [
      "@page { size: 58mm auto; margin: 0; }",
      "@media print {",
      "  body * { display: none !important; }",
      "  body { display: block !important; background: #fff; margin: 0; padding: 0; }",
      "  .nexpos-print-only, .nexpos-print-only * { display: block !important; }",
      "  .nexpos-print-only {",
      "    font-family: monospace; font-size: 12px; width: 58mm; margin: 0 auto; padding: 2mm 2mm; color: #000; line-height: 1.2; ",
      "  }",
      "  .nexpos-print-only .header { text-align: center; margin-bottom: 4px; border-bottom: 1px dashed #000; padding-bottom: 4px; }",
      "  .nexpos-print-only .header h2 { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: normal; text-transform: uppercase; }",
      "  .nexpos-print-only .header p { font-size: 10px; margin: 1px 0; }",
      "  .nexpos-print-only .divider { border-top: 1px dashed #000; margin: 4px 0; }",
      "  .nexpos-print-only .item { display: flex !important; justify-content: space-between; align-items: flex-start; font-size: 11px; margin: 1px 0; gap: 2px; }",
      "  .nexpos-print-only .item .name { flex: 1 1 auto; min-width: 0; word-break: break-word; white-space: normal; }",
      "  .nexpos-print-only .item .qty, .nexpos-print-only .item .price { flex-shrink: 0; }",
      "  .nexpos-print-only .item .qty { width: 30px; text-align: center; }",
      "  .nexpos-print-only .item .price { width: 58px; text-align: right; }",
      "  .nexpos-print-only .totals { margin-top: 4px; border-top: 1px dashed #000; padding-top: 4px; }",
      "  .nexpos-print-only .total-line { display: flex !important; justify-content: space-between; font-size: 12px; margin: 1px 0; }",
      "  .nexpos-print-only .total-line.final { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: normal; border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }",
      "  .nexpos-print-only .footer { text-align: center; margin-top: 6px; font-size: 10px; border-top: 1px dashed #000; padding-top: 4px; }",
      "  .nexpos-print-only .text-center { text-align: center; }",
      "  .nexpos-print-only .text-right { text-align: right; }",
      "  .nexpos-print-only .bold { }",
      "  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }",
      "}",
    ].join("\n");
    document.head.appendChild(style);

    var div = document.createElement("div");
    div.id = "nexpos-print-container";
    div.className = "nexpos-print-only";
    div.style.cssText = "display:none;";
    div.innerHTML = htmlContent;
    document.body.appendChild(div);

    window.print();
  }
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
    + '<p style="font-size:14px;">Order #: ' + orderNumber + '</p>'
    + '<p>Time: ' + timeStr + '</p>'
    + '</div>'
    + '<div class="divider"></div>'
    + itemsHtml
    + '<div class="divider"></div>'
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
    + '<p style="font-size:14px;">Order #: ' + orderNumber + '</p>'
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
    + '<p style="font-size:14px;">Order #: ' + orderNumber + '</p>'
    + '<p>Time: ' + timeStr + '</p>'
    + '</div>'
    + '<div class="divider"></div>'
    + kotItemsHtml
    + '<div class="divider"></div>'
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
    + '<p style="font-size:14px;">Order #: ' + orderNumber + '</p>'
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
    + '<p class="text-center">ITEMS SOLD</p>'
    + itemsHtml
    + '<div class="footer"><p>- End of Report -</p></div>';
}
