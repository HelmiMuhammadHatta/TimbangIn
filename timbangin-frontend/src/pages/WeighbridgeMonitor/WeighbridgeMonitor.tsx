import React, { useState } from 'react';
import WeighbridgeDisplay from '../../components/Weighbridge/WeighbridgeDisplay';
import axiosInstance from '../../api/axiosInstance';
import { RotateCcw } from 'lucide-react';

export const WeighbridgeMonitor = () => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await axiosInstance.post('/weighbridge/reset');
    } catch (error) {
      console.error('Failed to reset weighbridge', error);
    } finally {
      // Add a small delay for visual feedback
      setTimeout(() => setIsResetting(false), 500);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-transparent rounded-lg">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-steel-100 mb-2">Weighbridge Monitor</h1>
        <p className="text-sm font-display text-gray-500 dark:text-gray-400">Live feed from digital scale hardware simulation</p>
      </div>

      <div className="w-full">
        <WeighbridgeDisplay />
      </div>

      <div className="mt-12 flex flex-col items-center">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-alert-red dark:hover:bg-red-600 text-white font-display font-bold uppercase tracking-wide rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-70"
        >
          <RotateCcw size={20} className={isResetting ? 'animate-spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Simulasikan Truck Baru (Reset)'}</span>
        </button>
        <p className="mt-3 text-sm font-display text-gray-500 dark:text-gray-400 text-center max-w-md">
          Tombol ini akan memanggil endpoint reset untuk mengatur berat kembali ke 0. Timbangan simulasi memiliki probabilitas random untuk mendeteksi beban (truck) baru saat berat berada di 0.
        </p>
      </div>
    </div>
  );
};
