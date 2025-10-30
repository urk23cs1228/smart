import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAx2K3B0TGLYUkb3CPjxCt4M6xbe-A4MBU",
  authDomain: "stemgame-b9979.firebaseapp.com",
  projectId: "stemgame-b9979",
  storageBucket: "stemgame-b9979.firebasestorage.app",
  messagingSenderId: "374983147995",
  appId: "1:374983147995:web:0cbf5317e07588b135a7fe",
  measurementId: "G-QJZ2GBSGZ6"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
