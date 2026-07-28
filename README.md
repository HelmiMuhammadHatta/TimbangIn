# TimbangIn - Weighbridge Management System

Sistem Manajemen Jembatan Timbang dengan integrasi ANPR.

## Tech Stack
- Backend: ASP.NET Core 8 Web API (Clean Architecture), EF Core, PostgreSQL
- Frontend: React, Vite, TypeScript, TailwindCSS, Zustand
- Authentication: JWT with Refresh Token (HttpOnly Cookie)

## Persyaratan
- .NET 8 SDK
- Node.js & npm
- PostgreSQL (running di `localhost:5432`)

## Konfigurasi Database
Secara default, aplikasi backend menggunakan string koneksi:
`Host=localhost;Database=TimbangInDb;Username=postgres;Password=postgres`
Pastikan PostgreSQL Anda berjalan, atau ubah connection string di `C:\TimbangIn\TimbangIn.API\appsettings.json`.

## Cara Menjalankan Backend
1. Buka terminal, masuk ke folder backend API:
   ```bash
   cd C:\TimbangIn\TimbangIn.API
   ```
2. Jalankan aplikasi:
   ```bash
   dotnet run
   ```
3. Saat pertama kali dijalankan, sistem akan otomatis mengaplikasikan migrasi database dan melakukan *seeding* data awal.
4. Akses Swagger UI di `https://localhost:xxxx/swagger` (port menyesuaikan output terminal).
5. **Akun Login Default (Admin)**
   - Username: `admin`
   - Password: `Admin123!`

## Cara Menjalankan Frontend
1. Buka terminal baru, masuk ke folder frontend:
   ```bash
   cd C:\TimbangIn\timbangin-frontend
   ```
2. Instal dependensi (jika belum):
   ```bash
   npm install
   ```
3. Jalankan Vite development server:
   ```bash
   npm run dev
   ```
4. Buka browser di `http://localhost:5173`. Anda akan diarahkan ke halaman login. Gunakan akun admin di atas untuk masuk.
