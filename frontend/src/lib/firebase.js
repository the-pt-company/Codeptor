// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqR8LHV-blJzMcOaoL1LeoR3pT2btrKzQ",
  authDomain: "kudosdev-44520.firebaseapp.com",
  projectId: "kudosdev-44520",
  storageBucket: "kudosdev-44520.firebasestorage.app",
  messagingSenderId: "222567250714",
  appId: "1:222567250714:web:f48c6f6f1d2f948d2b0aa3",
  measurementId: "G-SWGFJL1QJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, app };
