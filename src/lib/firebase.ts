import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARqUvfBxgREAa_qFlCON2eioQv-f2Ebds",
  authDomain: "arshadmobileshop-2d7cb.firebaseapp.com",
  projectId: "arshadmobileshop-2d7cb",
  storageBucket: "arshadmobileshop-2d7cb.firebasestorage.app",
  messagingSenderId: "437217555268",
  appId: "1:437217555268:web:4c48aedb378c908d96dd11"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
