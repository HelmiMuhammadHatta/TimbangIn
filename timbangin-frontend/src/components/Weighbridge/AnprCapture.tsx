import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, Crosshair, Search, Plus, ArrowRight, User, Building, Truck, ShieldCheck, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import Modal from '../UI/Modal';

interface AnprResult {
  plateNumber: string;
  confidence: number;
  processingTimeMs: number;
  isMatched: boolean;
  truckId?: string;
  imageUrl: string;
  strategy?: string;
  matchedTruck?: any;
}

interface CustomerLookup {
  id: string;
  name: string;
}

interface AnprCaptureProps {
  onDetectResult?: (plateNumber: string, photoPath: string) => void;
  showProceedButton?: boolean;
}

export const AnprCapture: React.FC<AnprCaptureProps> = ({ 
  onDetectResult, 
  showProceedButton = true 
}) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isValidatingManual, setIsValidatingManual] = useState(false);
  const [result, setResult] = useState<AnprResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [manualPlate, setManualPlate] = useState('');

  // Quick-Add Truck Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerLookup[]>([]);
  const [isQuickAddSubmitting, setIsQuickAddSubmitting] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [quickAddForm, setQuickAddForm] = useState({
    plateNumber: '',
    driverName: '',
    customerId: '',
    maxCapacityKg: 10000,
    isActive: true
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/customers', { params: { PageSize: 100 } });
      if (response.data.success) {
        setCustomers(response.data.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError('Gagal mengakses kamera: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    fetchCustomers();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Gagal mengambil gambar dari kamera.');
          setIsCapturing(false);
          return;
        }

        const formData = new FormData();
        formData.append('image', blob, `capture_${Date.now()}.jpg`);

        try {
          const response = await axiosInstance.post('/anpr/detect', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (response.data.success) {
            const data = response.data.data;
            setResult(data);
            setManualPlate(data.plateNumber || '');
            if (onDetectResult && data.plateNumber) {
              onDetectResult(data.plateNumber, data.imageUrl || '');
            }
          } else {
            setError(response.data.message || 'Gagal deteksi ANPR');
          }
        } catch {
          setError('Terjadi kesalahan jaringan atau server ANPR belum aktif.');
        } finally {
          setIsCapturing(false);
        }
      }, 'image/jpeg', 0.9);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDetectResult]);

  const handleManualValidate = async () => {
    if (!manualPlate.trim()) return;
    setIsValidatingManual(true);
    try {
      const cleanInput = manualPlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      // 1. Try direct plate lookup
      try {
        const directRes = await axiosInstance.get(`/trucks/by-plate/${cleanInput}`);
        if (directRes.data.success && directRes.data.data) {
          const found = directRes.data.data;
          setResult({
            plateNumber: found.plateNumber,
            confidence: 1.0,
            processingTimeMs: 0,
            isMatched: true,
            truckId: found.id,
            imageUrl: result?.imageUrl || '',
            strategy: 'manual_validation',
            matchedTruck: found
          });
          setManualPlate(found.plateNumber);
          if (onDetectResult) {
            onDetectResult(found.plateNumber, result?.imageUrl || '');
          }
          return;
        }
      } catch {
        // Fallback to query
      }

      // 2. Fallback search
      const response = await axiosInstance.get('/trucks', {
        params: { SearchTerm: cleanInput, PageSize: 50 }
      });
      
      if (response.data.success) {
        const found = response.data.data.items?.find((t: any) => 
          t.plateNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanInput ||
          (t.plateNumberNormalized && t.plateNumberNormalized.toUpperCase() === cleanInput)
        );

        if (found) {
          setResult({
            plateNumber: found.plateNumber,
            confidence: 1.0,
            processingTimeMs: 0,
            isMatched: true,
            truckId: found.id,
            imageUrl: result?.imageUrl || '',
            strategy: 'manual_validation',
            matchedTruck: found
          });
          setManualPlate(found.plateNumber);
          if (onDetectResult) {
            onDetectResult(found.plateNumber, result?.imageUrl || '');
          }
        } else {
          setResult({
            plateNumber: manualPlate.trim().toUpperCase(),
            confidence: 1.0,
            processingTimeMs: 0,
            isMatched: false,
            imageUrl: result?.imageUrl || '',
            strategy: 'manual_input'
          });
          if (onDetectResult) {
            onDetectResult(manualPlate.trim().toUpperCase(), result?.imageUrl || '');
          }
        }
      }
    } catch (err) {
      console.error('Error validating manual plate:', err);
    } finally {
      setIsValidatingManual(false);
    }
  };

  // Open Quick-Add Truck Modal
  const handleOpenQuickAdd = () => {
    const defaultPlate = (manualPlate.trim() || result?.plateNumber || '').toUpperCase();
    setQuickAddForm({
      plateNumber: defaultPlate,
      driverName: '',
      customerId: customers.length > 0 ? customers[0].id : '',
      maxCapacityKg: 10000,
      isActive: true
    });
    setQuickAddError(null);
    setIsQuickAddOpen(true);
  };

  // Submit Quick-Add Form
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuickAddSubmitting(true);
    setQuickAddError(null);

    try {
      const cleanPlate = quickAddForm.plateNumber.trim().toUpperCase();
      if (!cleanPlate) {
        setQuickAddError('Plat nomor wajib diisi.');
        setIsQuickAddSubmitting(false);
        return;
      }
      if (!quickAddForm.driverName.trim()) {
        setQuickAddError('Nama sopir wajib diisi.');
        setIsQuickAddSubmitting(false);
        return;
      }
      if (!quickAddForm.customerId) {
        setQuickAddError('Pilih customer/vendor.');
        setIsQuickAddSubmitting(false);
        return;
      }
      if (!quickAddForm.maxCapacityKg || quickAddForm.maxCapacityKg <= 0) {
        setQuickAddError('Kapasitas maksimal harus lebih dari 0 kg.');
        setIsQuickAddSubmitting(false);
        return;
      }

      const payload = {
        plateNumber: cleanPlate,
        driverName: quickAddForm.driverName.trim(),
        customerId: quickAddForm.customerId,
        maxCapacityKg: Number(quickAddForm.maxCapacityKg),
        isActive: quickAddForm.isActive
      };

      const res = await axiosInstance.post('/trucks', payload);

      if (res.data.success && res.data.data) {
        const createdTruck = res.data.data;

        // =========================================================================
        // === STATE MANAGEMENT: TRANSISI STATUS DARI 'UNMATCHED' KE 'MATCHED' ===
        // =========================================================================
        // Setelah registrasi cepat (Quick-Add) berhasil di backend via POST /api/trucks:
        // 1. Backend mengembalikan objek TruckDto lengkap beserta CustomerName & DriverName.
        // 2. Kita memperbarui state lokal 'result' secara reaktif:
        //    - isMatched diset ke true
        //    - truckId & matchedTruck diisi dengan data createdTruck
        //    - plateNumber disesuaikan dengan format standar yang disimpan
        // 3. Efek visual di UI:
        //    - Peringatan kuning "Truk Tidak Terdaftar" langsung hilang.
        //    - Panel hijau "Truk Terdaftar di Database" langsung aktif menampilkan
        //      Plat, Sopir, Customer, dan Kapasitas Maksimal.
        //    - Tombol "Lanjut ke Timbangan (Buat Transaksi)" langsung aktif (enabled).
        // 4. Memanggil onDetectResult callback agar parent component (jika ada) terupdate.
        // =========================================================================
        setResult({
          plateNumber: createdTruck.plateNumber,
          confidence: 1.0,
          processingTimeMs: result?.processingTimeMs || 0,
          isMatched: true,
          truckId: createdTruck.id,
          imageUrl: result?.imageUrl || '',
          strategy: 'quick_add_success',
          matchedTruck: createdTruck
        });

        setManualPlate(createdTruck.plateNumber);
        setIsQuickAddOpen(false);

        if (onDetectResult) {
          onDetectResult(createdTruck.plateNumber, result?.imageUrl || '');
        }
      } else {
        setQuickAddError(res.data.message || 'Gagal mendaftarkan truk baru.');
      }
    } catch (err: any) {
      console.error('Error creating quick-add truck:', err);
      let errorMsg = 'Terjadi kesalahan saat mendaftarkan truk.';
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.errors) {
          const errors = err.response.data.errors;
          if (Array.isArray(errors)) {
            errorMsg = errors.join('\n');
          } else if (typeof errors === 'object') {
            errorMsg = Object.values(errors).flat().join('\n');
          }
        }
      }
      setQuickAddError(errorMsg);
    } finally {
      setIsQuickAddSubmitting(false);
    }
  };

  const handleProceedToWeighIn = () => {
    if (!result || !result.isMatched) return;
    navigate('/weigh-in', {
      state: {
        truckId: result.truckId,
        plateNumber: result.plateNumber,
        customerId: result.matchedTruck?.customerId,
        imageUrl: result.imageUrl
      }
    });
  };

  useEffect(() => {
    let interval: any;
    if (autoCapture && !isCapturing) {
      interval = setInterval(() => {
        captureAndDetect();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCapture, isCapturing, captureAndDetect]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera View with Focus Target Frame */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Kamera Gate (Live ANPR)
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400 flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoCapture}
                  onChange={(e) => setAutoCapture(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                Auto-Capture (5s)
              </label>
            </div>
          </div>
          
          <div className="relative bg-black flex-1 min-h-[340px] flex items-center justify-center overflow-hidden">
            {error ? (
              <div className="text-red-400 p-4 text-center">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
                <button 
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />

                {/* High-tech Viewfinder / Focus Target Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  {/* Dark Vignette around edges */}
                  <div className="absolute inset-0 border-[30px] md:border-[45px] border-black/40" />

                  {/* Target Focus Rectangle */}
                  <div className="relative w-[75%] max-w-[420px] h-[130px] rounded-lg border-2 border-dashed border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center">
                    {/* Top-Left Corner */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl" />
                    {/* Top-Right Corner */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr" />
                    {/* Bottom-Left Corner */}
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl" />
                    {/* Bottom-Right Corner */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br" />
                    
                    {/* Animated Laser Scanning Line */}
                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-pulse" />

                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs font-mono font-medium text-cyan-300 flex items-center gap-1.5 shadow">
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>AREA FOKUS PLAT NOMOR</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs font-medium text-white/90 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full shadow">
                    Posisikan plat nomor kendaraan di dalam kotak fokus
                  </p>
                </div>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
            
            {isCapturing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                <p className="text-white font-medium text-sm">Memfokuskan & Mendeteksi Plat...</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-800/80 border-t border-slate-700">
            <button
              onClick={captureAndDetect}
              disabled={isCapturing || !!error}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              Capture & Deteksi Plat
            </button>
          </div>
        </div>

        {/* Result View */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                Hasil Deteksi Plat
              </h2>
              {result && (
                <span className="text-xs px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full font-mono">
                  ANPR Status: {result.isMatched ? 'Terdaftar' : 'Belum Terdaftar'}
                </span>
              )}
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              {result ? (
                <>
                  <div className="text-center">
                    <div className="inline-block px-8 py-3.5 bg-slate-900 border-2 border-cyan-500/50 rounded-xl shadow-inner mb-2">
                      <span className="text-3xl md:text-4xl font-mono font-extrabold tracking-wider text-white">
                        {result.plateNumber || 'TIDAK TERBACA'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Akurasi: <span className="font-semibold text-cyan-400">{(result.confidence * 100).toFixed(1)}%</span> • 
                      Waktu Pemrosesan: <span className="font-semibold text-cyan-400">{result.processingTimeMs}ms</span>
                    </p>
                  </div>

                  {result.isMatched ? (
                    <div className="p-4 bg-emerald-900/30 border border-emerald-700/60 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                        <div>
                          <h3 className="text-emerald-400 font-semibold text-base">Truk Terdaftar di Database</h3>
                          <p className="text-xs text-emerald-300/70">Data kendaraan berhasil dicocokkan otomatis</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm bg-slate-900/60 p-3 rounded-lg border border-emerald-900/50">
                        <div>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            Customer / Vendor
                          </p>
                          <p className="font-semibold text-white truncate">{result.matchedTruck?.customerName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Nama Sopir
                          </p>
                          <p className="font-semibold text-white truncate">{result.matchedTruck?.driverName || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-400">Kapasitas Maksimal</p>
                          <p className="font-semibold text-cyan-300">{result.matchedTruck?.maxCapacityKg?.toLocaleString()} Kg</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl">
                      <div className="flex items-start gap-3 mb-2">
                        <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-amber-400 font-semibold text-base">Truk Tidak Ditemukan di Database!</h3>
                          <p className="text-xs text-amber-200/80 mt-0.5">
                            Plat nomor ini belum terdaftar di Master Truck. Anda dapat mengoreksi plat secara manual atau mendaftarkannya secara instan.
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <label className="text-xs font-medium text-slate-300">Koreksi / Validasi Plat Manual</label>
                        <div className="flex flex-wrap gap-2">
                          <input 
                            type="text" 
                            value={manualPlate}
                            onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleManualValidate();
                            }}
                            className="flex-1 min-w-[140px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                            placeholder="Contoh: R 3905 DW"
                          />
                          <button 
                            onClick={handleManualValidate}
                            disabled={isValidatingManual || !manualPlate.trim()}
                            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Validasi manual plat nomor"
                          >
                            {isValidatingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                            Validasi
                          </button>
                          <button 
                            onClick={handleOpenQuickAdd}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Daftarkan truk baru tanpa pindah halaman"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            + Daftarkan Truk Baru
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                  <Camera className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm">Arahkan kamera ke plat kendaraan lalu klik <b>Capture & Deteksi Plat</b></p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button: Lanjut ke Timbangan (Buat Transaksi) */}
          {showProceedButton && (
            <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex flex-col gap-2">
              <button
                onClick={handleProceedToWeighIn}
                disabled={!result || !result.isMatched}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Lanjut ke Timbangan (Buat Transaksi)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              {result && !result.isMatched && (
                <p className="text-[11px] text-amber-400/90 text-center font-medium">
                  * Daftarkan truk baru atau lakukan koreksi plat untuk melanjutkan ke timbangan
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick-Add Truck Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddError(null);
        }}
        title="Daftarkan Truk Baru (Quick-Add)"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
          {quickAddError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal Mendaftarkan Truk</p>
                <p className="text-xs whitespace-pre-line">{quickAddError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Plat Nomor (No. Polisi) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: R 3905 DW atau R3905DW"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm font-mono uppercase font-semibold rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={quickAddForm.plateNumber}
              onChange={(e) => setQuickAddForm({ ...quickAddForm, plateNumber: e.target.value.toUpperCase() })}
            />
            <p className="mt-1 text-xs text-gray-500">Format plat nomor Indonesia (bisa dengan atau tanpa spasi)</p>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Nama Sopir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan nama sopir"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={quickAddForm.driverName}
              onChange={(e) => setQuickAddForm({ ...quickAddForm, driverName: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Customer / Vendor (Pemilik) <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={quickAddForm.customerId}
              onChange={(e) => setQuickAddForm({ ...quickAddForm, customerId: e.target.value })}
            >
              <option value="">-- Pilih Customer / Vendor --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Kapasitas Maksimal (Kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Contoh: 10000"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={quickAddForm.maxCapacityKg || ''}
              onChange={(e) => setQuickAddForm({ ...quickAddForm, maxCapacityKg: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center">
            <input
              id="quickAddActive"
              type="checkbox"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              checked={quickAddForm.isActive}
              onChange={(e) => setQuickAddForm({ ...quickAddForm, isActive: e.target.checked })}
            />
            <label htmlFor="quickAddActive" className="ms-2 text-sm font-medium text-gray-800">
              Aktifkan truk ini
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={isQuickAddSubmitting}
              className="py-2.5 px-4 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setIsQuickAddOpen(false);
                setQuickAddError(null);
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isQuickAddSubmitting}
              className="py-2.5 px-5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-2 cursor-pointer shadow"
            >
              {isQuickAddSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Simpan & Daftarkan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

