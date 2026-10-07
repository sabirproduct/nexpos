import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { format } from "date-fns";

/**
 * Save a new order to Firestore
 */
export async function saveOrder(order) {
  const ordersCol = collection(db, "orders");
  const docRef = await addDoc(ordersCol, {
    ...order,
    createdAt: Date.now(),
    date: format(new Date(), "yyyy-MM-dd"),
    status: order.status || "pending", // pending, preparing, completed, billed
  });
  return { ...order, id: docRef.id, createdAt: Date.now() };
}

/**
 * Update an existing order
 */
export function updateOrder(orderId, updates) {
  const orderRef = doc(db, "orders", orderId);
  return updateDoc(orderRef, updates);
}

/**
 * Delete an order
 */
export function deleteOrder(orderId) {
  const orderRef = doc(db, "orders", orderId);
  return deleteDoc(orderRef);
}

/**
 * Listen to all orders (realtime)
 */
export function listenOrders(callback) {
  const ordersCol = collection(db, "orders");
  const unsub = onSnapshot(ordersCol, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
  return unsub;
}

/**
 * Listen to orders by date
 */
export function listenOrdersByDate(date, callback) {
  const ordersCol = collection(db, "orders");
  const q = query(ordersCol, where("date", "==", date));
  const unsub = onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
  return unsub;
}

/**
 * Get orders for a specific date (one-time fetch)
 */
export async function getOrdersByDate(date) {
  const ordersCol = collection(db, "orders");
  const q = query(ordersCol, where("date", "==", date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get all orders (one-time fetch)
 */
export async function getAllOrders() {
  const ordersCol = collection(db, "orders");
  const snapshot = await getDocs(ordersCol);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Save a menu item
 */
export async function saveMenuItem(item) {
  const itemsCol = collection(db, "menuItems");
  const docRef = await addDoc(itemsCol, {
    ...item,
    createdAt: Date.now(),
  });
  return { ...item, id: docRef.id, createdAt: Date.now() };
}

/**
 * Listen to menu items
 */
export function listenMenuItems(callback) {
  const itemsCol = collection(db, "menuItems");
  const unsub = onSnapshot(itemsCol, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(items);
  });
  return unsub;
}

/**
 * Generate a daily sales report
 */
/**
 * Generate a unique order number (daily sequential)
 * Format: ORD-YYYYMMDD-XXX
 */
export async function getNextOrderNumber() {
  const today = format(new Date(), "yyyy-MM-dd");
  const shortDate = format(new Date(), "yyyyMMdd");
  const counterRef = doc(db, "counters", "orderCounter");

  try {
    const result = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(counterRef);
      if (docSnap.exists() && docSnap.data().date === today) {
        const newCount = docSnap.data().count + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      } else {
        transaction.set(counterRef, { date: today, count: 1 });
        return 1;
      }
    });
    const padded = String(result).padStart(3, "0");
    return { orderNumber: `ORD-${shortDate}-${padded}`, count: result };
  } catch (e) {
    return { orderNumber: `ORD-${shortDate}-001`, count: 1 };
  }
}

/**
 * Get restaurant settings
 */
export async function getRestaurantSettings() {
  const settingsRef = doc(db, "settings", "restaurant");
  const docSnap = await getDoc(settingsRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return { name: "NexPOS Restaurant", address: "", phone: "" };
}

/**
 * Update restaurant settings
 */
export function updateRestaurantSettings(settings) {
  const settingsRef = doc(db, "settings", "restaurant");
  return setDoc(settingsRef, settings, { merge: true });
}

/**
 * Get user role from Firestore
 */
export async function getUserRole(uid) {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

/**
 * Set user role
 */
export function setUserRole(uid, data) {
  const userRef = doc(db, "users", uid);
  return setDoc(userRef, data, { merge: true });
}

/**
 * Get all registered users
 */
export async function getAllUsers() {
  const usersCol = collection(db, "users");
  const snapshot = await getDocs(usersCol);
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
}

/**
 * Delete a user document from Firestore
 */
export function deleteUserDoc(uid) {
  const userRef = doc(db, "users", uid);
  return deleteDoc(userRef);
}

/**
 * Listen to all users in realtime
 */
export function listenUsers(callback) {
  const usersCol = collection(db, "users");
  const unsub = onSnapshot(usersCol, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    callback(users);
  });
  return unsub;
}

export async function generateDailyReport(date) {
  const orders = await getOrdersByDate(date);
  const billedOrders = orders.filter((o) => o.status === "billed");

  const totalSales = billedOrders.reduce((sum, o) => {
    const orderTotal = o.items.reduce(
      (s, item) => s + (item.price || item.sellingPrice || 0) * item.quantity,
      0
    );
    return sum + orderTotal;
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

/**
 * Get orders within a date range
 */
export async function getOrdersByDateRange(startDate, endDate) {
  const ordersCol = collection(db, "orders");
  const q = query(
    ordersCol,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update a menu item
 */
export function updateMenuItem(itemId, updates) {
  const itemRef = doc(db, "menuItems", itemId);
  return updateDoc(itemRef, updates);
}

/**
 * Generate a unique bill number (daily sequential)
 * Format: BILL-YYYYMMDD-XXX
 */
export async function getNextBillNumber() {
  const today = format(new Date(), "yyyy-MM-dd");
  const shortDate = format(new Date(), "yyyyMMdd");
  const counterRef = doc(db, "counters", "billCounter");

  try {
    const result = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(counterRef);
      if (docSnap.exists() && docSnap.data().date === today) {
        const newCount = docSnap.data().count + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      } else {
        transaction.set(counterRef, { date: today, count: 1 });
        return 1;
      }
    });
    const padded = String(result).padStart(3, "0");
    return { billNumber: `BILL-${shortDate}-${padded}`, count: result };
  } catch (e) {
    // Fallback
    return { billNumber: `BILL-${shortDate}-${Date.now().toString(36).toUpperCase().slice(-3)}`, count: 0 };
  }
}

/**
 * Generate report for a date range (weekly/monthly)
 */
export async function generateRangeReport(startDate, endDate) {
  const orders = await getOrdersByDateRange(startDate, endDate);
  const billedOrders = orders.filter((o) => o.status === "billed");

  // Group by date for chart
  const dailyMap = {};
  const dateLabels = [];

  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const key = format(current, "yyyy-MM-dd");
    dateLabels.push(key);
    dailyMap[key] = 0;
    current.setDate(current.getDate() + 1);
  }

  let totalSales = 0;
  billedOrders.forEach((o) => {
    const orderTotal = o.items.reduce(
      (s, item) => s + (item.price || item.sellingPrice || 0) * item.quantity,
      0
    );
    totalSales += orderTotal;
    if (dailyMap[o.date] !== undefined) {
      dailyMap[o.date] += orderTotal;
    }
  });

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

  const chartData = dateLabels.map((date) => ({
    date: format(new Date(date), "MMM dd"),
    sales: Math.round(dailyMap[date] * 100) / 100,
  }));

  return {
    startDate,
    endDate,
    totalOrders: billedOrders.length,
    totalSales: Math.round(totalSales * 100) / 100,
    items: Object.values(itemMap),
    orders: billedOrders,
    chartData,
  };
}
