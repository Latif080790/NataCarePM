// Lokasi: src/index.ts

import { db, auth } from './firebaseConfig.ts';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

// --- Ambil Elemen dari HTML ---
const subtitle = document.getElementById('subtitle');
const emailInput = document.getElementById('email-input') as HTMLInputElement;
const passwordInput = document.getElementById('password-input') as HTMLInputElement;
const signupButton = document.getElementById('signup-button');
const signinButton = document.getElementById('signin-button');
const logoutButton = document.getElementById('logout-button');
const loginForm = document.getElementById('login-form');
const userStatusCard = document.getElementById('user-status-card');
const userStatus = document.getElementById('user-status');
const firestoreContent = document.getElementById('firestore-content');

// --- Fungsi-fungsi Autentikasi ---
const signUpUser = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert(`Akun untuk ${userCredential.user.email} berhasil dibuat!`);
  } catch (error) {
    alert(`Gagal mendaftar: ${error.message}`);
  }
};

const signInUser = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert(`Selamat datang kembali, ${userCredential.user.email}!`);
  } catch (error) {
    alert(`Gagal masuk: ${error.message}`);
  }
};

const logoutUser = async () => {
  await signOut(auth);
  alert("Anda telah keluar.");
};

// --- Fungsi Akses Data Firestore ---
const fetchProjects = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "projects")); // Ganti "projects" dengan nama koleksi Anda
    if (querySnapshot.empty) {
      firestoreContent.innerHTML = "Belum ada proyek yang ditambahkan.";
    } else {
      let projectsHTML = "<ul>";
      querySnapshot.forEach(doc => {
        projectsHTML += `<li class="p-2 border-b">${doc.data().name || doc.id}</li>`; // Asumsi ada field 'name'
      });
      projectsHTML += "</ul>";
      firestoreContent.innerHTML = projectsHTML;
    }
  } catch (error) {
    firestoreContent.innerHTML = `<span class="text-red-500">Gagal memuat data: ${error.message}</span>`;
  }
};

// --- Event Listeners untuk Tombol ---
signupButton.addEventListener('click', signUpUser);
signinButton.addEventListener('click', signInUser);
logoutButton.addEventListener('click', logoutUser);

// --- Monitor Utama Status Login Pengguna ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Pengguna sedang login
    subtitle.textContent = "Anda telah masuk ke dalam aplikasi.";
    userStatus.textContent = `Login sebagai: ${user.email}`;
    
    loginForm.classList.add('hidden');
    userStatusCard.classList.remove('hidden');
    
    fetchProjects(); // Ambil data dari Firestore setelah login berhasil

  } else {
    // Tidak ada pengguna yang login
    subtitle.textContent = "Silakan masuk atau daftar untuk melanjutkan.";
    
    loginForm.classList.remove('hidden');
    userStatusCard.classList.add('hidden');
    firestoreContent.innerHTML = "Memuat data proyek..."; // Reset konten
  }
});