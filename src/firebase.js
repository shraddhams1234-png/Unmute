import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGpj9pgjB2UeFMd7wmywyDBv9R6mWn5q8",
  authDomain: "unmute-app-18530.firebaseapp.com",
  projectId: "unmute-app-18530",
  storageBucket: "unmute-app-18530.firebasestorage.app",
  messagingSenderId: "759413149079",
  appId: "1:759413149079:web:403b503646e0d9022548d2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);