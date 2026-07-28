import { AnprCapture } from '../../components/Weighbridge/AnprCapture';

const GateMonitor = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitor Gate Masuk</h1>
          <p className="text-slate-400">Deteksi plat nomor truk otomatis menggunakan kamera gate (ANPR)</p>
        </div>
      </div>

      {/* ANPR Capture Component */}
      <AnprCapture />
      
      {/* 
        Di sini nanti bisa ditambahkan komponen lain seperti:
        - Daftar antrean truk yang sudah masuk
        - Log history deteksi plat
      */}
    </div>
  );
};

export default GateMonitor;
