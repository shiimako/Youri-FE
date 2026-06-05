# 🍳 YOURI - Frontend

YOURI (Your Recipe Journey) adalah aplikasi pendamping memasak berbasis AI yang membantu pengguna menemukan resep berdasarkan bahan yang tersedia, memantau progres memasak, dan meningkatkan motivasi melalui sistem gamifikasi.

Frontend ini dibangun menggunakan React + Vite dengan desain responsif untuk desktop maupun mobile.

---

## ✨ Fitur Utama

### 🔐 Authentication

* Login
* Register
* Login dengan Google
* Forgot Password
* Reset Password menggunakan OTP

### 🏠 Dashboard

* Ringkasan aktivitas pengguna
* Rekomendasi resep
* Progress level pengguna
* Informasi gamifikasi

### 👨‍🍳 Cooking Assistant

* Pencarian resep berdasarkan bahan
* Perbandingan bahan pengganti
* Detail resep
* Memulai aktivitas memasak
* Tracking progres memasak

### 📖 Recipe Management

* Melihat resep milik pengguna
* Menambahkan resep baru
* Mengedit resep
* Menghapus resep

### 🎮 Gamification

* Sistem XP dan Level
* Weekly History
* Klaim hadiah mingguan
* Koleksi Sprite
* Equip Sprite Character

### 🔔 Notification

* Melihat notifikasi
* Menandai notifikasi sebagai dibaca

### 👤 User Profile

* Melihat profil
* Mengubah profil
* Mengelola avatar

### 🛡️ Admin Portal

* Moderasi laporan resep
* Manajemen Sprite Package
* Manajemen Sprite Asset

---

## 🏗️ Tech Stack

### Frontend

* React 19
* Vite
* React Router DOM
* Axios

### UI & Styling

* Tailwind CSS
* React Icons
* Framer Motion

### Authentication

* Google OAuth

---

## 📂 Struktur Routing

```text
/
├── /login
├── /register
├── /forgot-password
│
├── /dashboard
├── /profile
├── /profile/sprites
├── /weekly-history
│
├── /cooking/start
├── /cooking/recipe/:id
├── /cooking/recipe/:id/compare
│
├── /my-recipes
├── /my-recipes/create
├── /my-recipes/edit/:id
│
├── /notifications
│
├── /admin
├── /admin/reports
├── /admin/sprites
└── /admin/sprites/:package_id
```

---

## 🚀 Instalasi

### Clone Repository

```bash
git clone https://github.com/username/youri-frontend.git
cd youri-frontend
```

### Install Dependencies

```bash
npm install
```

### Konfigurasi Environment

Buat file `.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

### Menjalankan Project

Development:

```bash
npm run dev
```

Build Production:

```bash
npm run build
```

Preview Production Build:

```bash
npm run preview
```

---

## 📱 Tampilan Aplikasi

### User Features

* Dashboard
* Profile
* Recipe Management
* Cooking Assistant
* Gamification
* Notifications

### Admin Features

* Admin Portal
* Recipe Moderation
* Sprite Management

---

## 🎯 Tujuan Pengembangan

YOURI dikembangkan untuk membantu pengguna:

* Menemukan resep berdasarkan bahan yang tersedia.
* Mengurangi kebingungan saat memasak.
* Memantau progres aktivitas memasak.
* Meningkatkan motivasi memasak melalui gamifikasi.
* Memberikan pengalaman belajar memasak yang lebih interaktif.

---

## 👨‍🎓 Proyek Tugas Akhir

**YOURI (Your Recipe Journey)**

Aplikasi Pendamping Memasak Berbasis Artificial Intelligence dan Gamification untuk Meningkatkan Pengalaman Memasak Pengguna.

---

## 📄 License

This project is licensed under the MIT License.
