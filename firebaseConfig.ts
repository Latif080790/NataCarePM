// Lokasi: src/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Bagian Krusial: Mendaftarkan setiap layanan Firebase
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";

// Konfigurasi proyek Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyBl8-t0rqqyl56G28HkgG8S32_SZUEqFY8",
    authDomain: "natacara-hns.firebaseapp.com",
    projectId: "natacara-hns",
    storageBucket: "natacara-hns.appspot.com",
    messagingSenderId: "118063816239",
    appId: "1:118063816239:web:11b43366e18bc71e9170da",
    measurementId: "G-7XPWRK3R2P"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi dan ekspor layanan untuk digunakan di seluruh aplikasi
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };