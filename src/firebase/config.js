import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3l3PGQ-FzMkE1aHdK4n7GBRz0GoLi1d8",
  authDomain: "nexposbilling.firebaseapp.com",
  projectId: "nexposbilling",
  storageBucket: "nexposbilling.firebasestorage.app",
  messagingSenderId: "115204577522",
  appId: "1:115204577522:web:ccf2538207c9316ec8986b",
  measurementId: "G-NHC2KGVFEP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
