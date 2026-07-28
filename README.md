# TimbangIn - Weighbridge Management System

Sistem Manajemen Jembatan Timbang dengan integrasi ANPR (Automatic Number Plate Recognition) untuk memantau, mendeteksi plat kendaraan secara otomatis, dan mengelola Master Data operasional timbangan.

## ✨ Fitur Utama (Stage 1-4)
- **Arsitektur Bersih (Clean Architecture)**: Pemisahan lapisan Domain, Application, Infrastructure, dan API.
- **Role-Based Access Control (RBAC)**: Autentikasi JWT yang dikonfigurasi lengkap dengan perizinan spesifik (`admin` dan `operator`).
- **Manajemen Master Data**: CRUD untuk Customer, MaterialType, dan TruckMaster.
- **Simulasi Weighbridge Real-Time**: Menggunakan SignalR dan FakeService untuk menyiarkan nilai timbangan yang bergerak dinamis.
- **Gate Monitor & ANPR**: Akses WebCam melalui peramban web (React), menangkap (_capture_) foto truk, lalu di-OCR secara _backend_ oleh Microservice Python (EasyOCR).

## 🛠️ Tech Stack
- **Backend**: ASP.NET Core 8 Web API, Entity Framework Core, PostgreSQL
- **Frontend**: React, Vite, TypeScript, TailwindCSS v4, Zustand, Axios
- **ANPR Service**: Python 3, FastAPI, OpenCV, EasyOCR
- **Authentication**: JWT dengan Refresh Token (HttpOnly Cookie)

---

## 📋 Persyaratan Sistem
Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:
- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- [Node.js & npm](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (berjalan di `localhost:5432`)
- [Python 3](https://www.python.org/)

---

## 🚀 Cara Menjalankan (Panduan Lengkap)

Sistem ini terdiri dari **tiga bagian utama** yang harus dijalankan secara bersamaan agar terhubung dengan baik. Bukalah 3 tab/jendela terminal (_Command Prompt_ / _Git Bash_) yang berbeda.

### 1. Menjalankan ANPR Service (Python) - Terminal 1
Microservice ini bertugas menerima gambar foto, mengekstraksi nomor plat melalui model *Machine Learning*, dan mengembalikannya ke sistem utama.

Jika Anda menggunakan **Git Bash**:
```bash
cd /c/TimbangIn/timbangin-anpr-service
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
export PYTHONIOENCODING=utf-8
python main.py
```
*(Catatan: Saat pertama kali dijalankan, sistem akan mengunduh model OCR ~15MB. Tunggu hingga tulisan `Application startup complete` muncul).*

### 2. Menjalankan Backend (.NET API) - Terminal 2
Backend menangani penyimpanan database, autentikasi, serta jembatan (*proxy*) antara ANPR Service dan Frontend.

- Pastikan PostgreSQL Anda hidup.
- Sesuaikan pengaturan *username/password* database di `C:\TimbangIn\TimbangIn.API\appsettings.json` (saat ini *default*: `Password=20`).

Jalankan server:
```bash
cd /c/TimbangIn/TimbangIn.API
dotnet run
```
Sistem akan otomatis mengaplikasikan **Migrasi Database** & melakukan **Seeding Data** awal saat dijalankan. Backend akan _listening_ pada `http://localhost:5266`.

### 3. Menjalankan Frontend (React) - Terminal 3
Tampilan antarmuka *dashboard* yang akan memandu staf operator/admin.

```bash
cd /c/TimbangIn/timbangin-frontend
npm install
npm run dev
```

---

## 🔐 Akun Login Default
Karena _database_ di-*seed* secara otomatis, Anda bisa menggunakan salah satu akun berikut untuk masuk di `http://localhost:5173`:

| Akun | Username | Password | Role |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin123!` | Admin (Akses Penuh) |
| **Staf Operator** | `operator` | `Operator123!` | Operator (Terbatas) |

---

## 🧪 Menguji Fitur Gate Monitor (ANPR)

1. Pastikan Anda _Login_ ke aplikasi menggunakan *browser*.
2. Pilih menu **Gate Monitor (ANPR)** di navigasi sebelah kiri.
3. Berikan **izin akses kamera** (_Allow Webcam_) di peramban web Anda.
4. Tulis salah satu **plat kendaraan yang terdaftar** (misalnya `B 1234 CD` atau `L 7890 KL`) di secarik kertas, atau cari gambarnya dari HP.
5. Arahkan plat tersebut ke kamera, lalu tekan **"Capture & Deteksi Plat"**.
6. Sistem akan mendeteksi nomor dan menampilkan warna hijau (_Truk Terdaftar_) jika cocok, beserta gambar tersimpan otomatis ke folder `wwwroot/anpr-captures/`.

---
*Dibuat oleh Tim DeepMind. Hak Cipta dilindungi undang-undang.*
