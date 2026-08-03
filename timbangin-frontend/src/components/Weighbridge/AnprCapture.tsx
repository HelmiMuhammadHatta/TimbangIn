import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, Crosshair, Search } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

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

interface AnprCaptureProps {
  onDetectResult?: (plateNumber: string, photoPath: string) => void;
}

export const AnprCapture: React.FC<AnprCaptureProps> = ({ onDetectResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isValidatingManual, setIsValidatingManual] = useState(false);
  const [result, setResult] = useState<AnprResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [manualPlate, setManualPlate] = useState('');

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
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg shadow-md transition-all flex justify-center items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Capture & Deteksi Plat
          </button>
        </div>
      </div>

      {/* Result View */}
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Hasil Deteksi Plat</h2>
          {result && (
            <span className="text-xs px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full font-mono">
              Fokus: Auto OCR
            </span>
          )}
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-6">
          {result ? (
            <>
              <div className="text-center">
                <div className="inline-block px-8 py-3.5 bg-slate-900 border-2 border-cyan-500/50 rounded-xl shadow-inner mb-2">
                  <span className="text-4xl font-mono font-extrabold tracking-wider text-white">
                    {result.plateNumber || 'TIDAK TERBACA'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Akurasi: <span className="font-semibold text-cyan-400">{(result.confidence * 100).toFixed(1)}%</span> • 
                  Waktu Pemrosesan: <span className="font-semibold text-cyan-400">{result.processingTimeMs}ms</span>
                </p>
              </div>

              {result.isMatched ? (
                <div className="p-4 bg-emerald-900/30 border border-emerald-800/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-emerald-400 font-semibold text-base">Truk Terdaftar di Database</h3>
                      <p className="text-xs text-emerald-300/70">Data kendaraan berhasil dicocokkan otomatis</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-slate-900/40 p-3 rounded-lg border border-emerald-900/30">
                    <div>
                      <p className="text-xs text-slate-400">Customer / Vendor</p>
                      <p className="font-semibold text-white">{result.matchedTruck?.customerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Nama Sopir</p>
                      <p className="font-semibold text-white">{result.matchedTruck?.driverName || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400">Kapasitas Maksimal</p>
                      <p className="font-semibold text-white">{result.matchedTruck?.maxCapacityKg?.toLocaleString()} Kg</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-900/30 border border-amber-800/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <h3 className="text-amber-400 font-semibold">Truk Tidak Ditemukan di Database!</h3>
                  </div>
                  <p className="text-xs text-amber-200/80 mb-3">
                    Plat nomor tidak ditemukan di Master Truck. Anda dapat mengoreksi plat secara manual di bawah ini.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Koreksi / Validasi Plat Manual</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={manualPlate}
                        onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleManualValidate();
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        placeholder="Contoh: R 3905 DW"
                      />
                      <button 
                        onClick={handleManualValidate}
                        disabled={isValidatingManual || !manualPlate.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {isValidatingManual ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Validasi
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
    </div>
  );
};
