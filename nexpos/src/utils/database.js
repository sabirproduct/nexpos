import { ref, push, set, update, remove, onValue, off, get } from "firebase/database";
import { db } from "../firebase/config";
import { format } from "date-fns";

/**
 * Save a new order to Firebase
 */
export function saveOrder(order) {
  const ordersRef = ref(db, "orders");
  const newOrderRef = push(ordersRef);
  const orderData = {
    ...order,
    id: newOrderRef.key,
    createdAt: Date.now(),
    date: format(new Date(), "yyyy-MM-dd"),
    status: order.status || "pending", // pending, preparing, completed, billed
  };
  return set(newOrderRef, orderData).then(() => orderData);
}

/**
 * Update an existing order
 */
export function updateOrder(orderId, updates) {
  const orderRef = ref(db, `orders/${orderId}`);
  return update(orderRef, updates);
}

/**
 * Delete an order
 */
export function deleteOrder(orderId) {
  const orderRef = ref(db, `orders/${orderId}`);
  return remove(orderRef);
}

/**
 * Listen to all orders (realtime)
 */
export function listenOrders(callback) {
  const ordersRef = ref(db, "orders");
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    const orders = data
      ? Object.entries(data).map(([id, order]) => ({ id, ...order }))
      : [];
    callback(orders);
  });
  return () => off(ordersRef);
}

/**
 * Listen to orders by date
 */
export function listenOrdersByDate(date, callback) {
  const ordersRef = ref(db, "orders");
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    const orders = data
      ? Object.entries(data)
          .map(([id, order]) => ({ id, ...order }))
          .filter((order) => order.date === date)
      : [];
    callback(orders);
  });
  return () => off(ordersRef);
}

/**
 * Get orders for a specific date (one-time fetch)
 */
export async function getOrdersByDate(date) {
  const ordersRef = ref(db, "orders");
  const snapshot = await get(ordersRef);
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data)
    .map(([id, order]) => ({ id, ...order }))
    .filter((order) => order.date === date);
}

/**
 * Get all orders (one-time fetch)
 */
export async function getAllOrders() {
  const ordersRef = ref(db, "orders");
  const snapshot = await get(ordersRef);
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([id, order]) => ({ id, ...order }));
}

/**
 * Save a menu item
 */
export function saveMenuItem(item) {
  const itemsRef = ref(db, "menuItems");
  const newItemRef = push(itemsRef);
  const itemData = { ...item, id: newItemRef.key, createdAt: Date.now() };
  return set(newItemRef, itemData).then(() => itemData);
}

/**
 * Listen to menu items
 */
export function listenMenuItems(callback) {
  const itemsRef = ref(db, "menuItems");
  onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    const items = data
      ? Object.entries(data).map(([id, item]) => ({ id, ...item }))
      : [];
    callback(items);
  });
  return () => off(itemsRef);
}

/**
 * Generate a daily sales report
 */
export async function generateDailyReport(date) {
  const orders = await getOrdersByDate(date);
  const billedOrders = orders.filter((o) => o.status === "billed");

  const totalSales = billedOrders.reduce((sum, o) => {
    const orderTotal = o.items.reduce(
      (s, item) => s + (item.price || item.sellingPrice || 0) * item.quantity,
      0
    );
    return sum + orderTotal + orderTotal * 0.05;
  }, 0);

  // Aggregate items
  const itemMap = {};
  billedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const name = item.name;
      if (!itemMap[name]) {
        itemMap[name] = { name, quantity: 0, total: 0 };
      }
      itemMap[name].quantity += item.quantity;
      itemMap[name].total +=
        (item.price || item.sellingPrice || 0) * item.quantity;
    });
  });

  return {
    date,
    totalOrders: billedOrders.length,
    totalSales: Math.round(totalSales * 100) / 100,
    items: Object.values(itemMap),
    orders: billedOrders,
  };
}
