# TimbangIn Weighbridge Simulator

Simulator ini digunakan untuk melakukan testing integrasi aplikasi `TimbangIn` dengan Serial Port timbangan digital tanpa harus menggunakan hardware fisik. Simulator akan bertindak layaknya timbangan sungguhan yang mengirimkan data berat secara continuous melalui COM port.

## 1. Persiapan: Install Virtual COM Port (com0com)

Agar simulator dapat mengirim data dan backend `TimbangIn.API` dapat membacanya, kita membutuhkan sepasang port virtual yang saling terhubung seperti sebuah kabel silang (null-modem).

1. Download dan install **com0com** (Null-modem emulator) di Windows.
2. Buka **Setup Command Prompt** bawaan com0com.
3. Buat pasangan port baru dengan mengetikkan:
   ```
   install PortName=COM5 PortName=COM6
   ```
   Atau Anda bisa menggunakan interface GUI dari com0com untuk menambahkan pasangan port `COM5` dan `COM6`.
4. Buka **Device Manager** di Windows, pastikan di bawah kategori "Ports (COM & LPT)" terdapat port `COM5` dan `COM6`.

## 2. Cara Menjalankan Simulator

Buka terminal/command prompt, masuk ke folder `TimbangIn.WeighbridgeSimulator`, lalu jalankan:

```bash
# Secara default, simulator akan menggunakan COM5
dotnet run

# Jika ingin menggunakan port lain (misal COM7):
dotnet run -- COM7
```

Saat dijalankan, simulator akan langsung mengirimkan data ke COM port.

## 3. Konfigurasi Backend

Pada backend `TimbangIn.API`, edit file `appsettings.json` atau `appsettings.Development.json`:

```json
  "Weighbridge": {
    "UseRealHardware": true,
    "ComPort": "COM6",
    "BaudRate": 9600,
    "DataBits": 8,
    "Parity": "None",
    "StopBits": "One"
  }
```

Pastikan `ComPort` backend adalah **pasangan** dari port simulator. Jika simulator di `COM5`, backend harus di `COM6`. Set `UseRealHardware` menjadi `true`.

## 4. Simulasi dan Testing

- Simulator akan mensimulasikan kondisi ketika truk naik ke atas timbangan. Anda akan melihat angka di frontend bergerak naik dan kemudian stabil di suatu angka antara 5000 - 25000 kg.
- Selama aplikasi berjalan, di terminal simulator, tekan tombol **`R`** untuk me-reset angka kembali ke `0` (Mensimulasikan truk turun dari timbangan).
- Tekan **`Q`** untuk menutup simulator.
- Buka URL frontend `/weighbridge-monitor` untuk melihat stream data secara real-time.
- Buka endpoint `GET /api/weighbridge/connection-status` untuk memverifikasi bahwa aplikasi berhasil terhubung ke COM port.
