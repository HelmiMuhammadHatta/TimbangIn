import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

interface AnprResult {
  plateNumber: string;
  confidence: number;
  processingTimeMs: number;
  isMatched: boolean;
  truckId?: string;
  imageUrl: string;
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
  const [result, setResult] = useState<AnprResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [manualPlate, setManualPlate] = useState('');

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
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
    setResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
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
            setResult(response.data.data);
            setManualPlate(response.data.data.plateNumber || '');
            if (onDetectResult) {
                onDetectResult(response.data.data.plateNumber, '');
            }
          } else {
            setError(response.data.message || 'Gagal deteksi ANPR');
          }
        } catch {
          setError('Terjadi kesalahan jaringan atau server ANPR mati.');
        } finally {
          setIsCapturing(false);
        }
      }, 'image/jpeg', 0.8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval: any;
    if (autoCapture && !isCapturing) {
      interval = setInterval(() => {
        captureAndDetect();
      }, 5000); // 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCapture, isCapturing, captureAndDetect]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Camera View */}
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Kamera Gate
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
        
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center">
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
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
          {isCapturing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <RefreshCw className="w-10 h-10 text-white animate-spin" />
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-800/80 border-t border-slate-700">
          <button
            onClick={captureAndDetect}
            disabled={isCapturing || !!error}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg shadow transition-colors flex justify-center items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Capture & Deteksi Plat
          </button>
        </div>
      </div>

      {/* Result View */}
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white">Hasil Deteksi</h2>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-6">
          {result ? (
            <>
              <div className="text-center">
                <div className="inline-block px-8 py-3 bg-slate-900 border-2 border-slate-600 rounded-lg shadow-inner mb-2">
                  <span className="text-4xl font-mono font-bold tracking-wider text-white">
                    {result.plateNumber || 'TIDAK TERBACA'}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Confidence: <span className="font-semibold text-blue-400">{(result.confidence * 100).toFixed(1)}%</span> • 
                  Waktu: <span className="font-semibold text-blue-400">{result.processingTimeMs}ms</span>
                </p>
              </div>

              {result.isMatched ? (
                <div className="p-4 bg-emerald-900/30 border border-emerald-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-emerald-400 font-semibold text-lg">Truk Terdaftar</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Customer</p>
                      <p className="font-medium text-white">{result.matchedTruck?.customerName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Sopir</p>
                      <p className="font-medium text-white">{result.matchedTruck?.driverName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Kapasitas</p>
                      <p className="font-medium text-white">{result.matchedTruck?.maxCapacityKg?.toLocaleString()} Kg</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-900/30 border border-amber-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                    <h3 className="text-amber-400 font-semibold">Truk Tidak Terdaftar!</h3>
                  </div>
                  <p className="text-sm text-amber-200/70 mb-4">
                    Plat nomor tidak ditemukan di Master Data Truk. Silakan periksa kembali atau input manual.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">Input Manual / Koreksi Plat</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={manualPlate}
                        onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Contoh: B 1234 ABC"
                      />
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                        Validasi Manual
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Process Button */}
              <div className="mt-auto pt-4 border-t border-slate-700">
                 <button className={`w-full py-3 font-semibold rounded-lg shadow transition-colors flex justify-center items-center gap-2 ${result.isMatched ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
                   Lanjut ke Timbangan (Buat Transaksi)
                 </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Camera className="w-16 h-16 mb-4 opacity-20" />
              <p>Menunggu tangkapan kamera...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
