import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBBudIj5nLwGPmdZAqhBAXNo9Iy3RzLI6s",
  authDomain: "autofill-agent.firebaseapp.com",
  projectId: "autofill-agent",
  storageBucket: "autofill-agent.firebasestorage.app",
  messagingSenderId: "472342885945",
  appId: "1:472342885945:web:d17f97aea821e3c126ffe8",
  measurementId: "G-MT53J4WCP6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
