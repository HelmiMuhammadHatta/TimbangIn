import React, { useState, useEffect } from 'react';
import { AnprCapture } from '../../components/Weighbridge/AnprCapture';
import axiosInstance from '../../api/axiosInstance';
import { TicketPrint } from '../../components/Weighbridge/TicketPrint';
import WeighbridgeDisplay from '../../components/Weighbridge/WeighbridgeDisplay';

export const WeighOut: React.FC = () => {
    const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    
    const [currentWeight, setCurrentWeight] = useState<number>(0);
    const [isWeightStable, setIsWeightStable] = useState<boolean>(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successTransaction, setSuccessTransaction] = useState<any>(null);
    
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPendingTransactions();
    }, []);

    const fetchPendingTransactions = async () => {
        try {
            const res = await axiosInstance.get('/weightransactions/pending');
            setPendingTransactions(res.data.data);
        } catch (err) {
            console.error('Failed to load pending transactions', err);
        }
    };

    const handleAnprResult = (plateNumber: string, _photoPath: string) => {
        const cleanTarget = plateNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const found = pendingTransactions.find(t => 
            (t.truckPlateNumber && t.truckPlateNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanTarget)
        );
        if (found) {
            setSelectedTransaction(found);
            setError('');
        } else {
            setError(`Tidak ada transaksi tertunda untuk plat ${plateNumber}.`);
        }
    };

    const handleWeightChange = (weight: number, isStable: boolean) => {
        setCurrentWeight(weight);
        setIsWeightStable(isStable);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isWeightStable) {
            setError('Berat belum stabil! Harap tunggu.');
            return;
        }

        if (!selectedTransaction) {
            setError('Pilih transaksi yang akan diselesaikan.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axiosInstance.post(`/weightransactions/${selectedTransaction.id}/complete`, {
                weighOutKg: currentWeight,
                weighOutPhotoPath: '' // Pass photo path if you store ANPR state locally
            });
            
            if (res.data.success) {
                setSuccessTransaction(res.data.data);
                fetchPendingTransactions();
            } else {
                setError(res.data.message || 'Gagal menyelesaikan transaksi.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Terjadi kesalahan pada server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredTransactions = pendingTransactions.filter(t => 
        t.truckPlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (successTransaction) {
        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 print:hidden">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaksi Selesai!</h2>
                        <p className="text-gray-600 mb-2">No. Tiket: <span className="font-semibold">{successTransaction.ticketNumber}</span></p>
                        <div className="bg-gray-50 rounded p-4 inline-block mb-6 text-left">
                            <p><strong>Plat:</strong> {successTransaction.truckPlateNumber}</p>
                            <p><strong>Bruto:</strong> {successTransaction.weighInKg} Kg</p>
                            <p><strong>Tara:</strong> {successTransaction.weighOutKg} Kg</p>
                            <p className="text-xl font-bold text-blue-600 mt-2">NETTO: {successTransaction.nettoKg} Kg</p>
                        </div>
                        
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Cetak Tiket
                            </button>
                            <button
                                onClick={() => {
                                    setSuccessTransaction(null);
                                    setSelectedTransaction(null);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Kembali ke Antrean
                            </button>
                        </div>
                    </div>
                </div>
                <TicketPrint transaction={successTransaction} />
            </div>
        );
    }

    return (
        <div className="space-y-6 print:hidden">
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-steel-100 uppercase tracking-wide">Timbang Keluar (Weigh-Out)</h1>
            
            {error && (
                <div className="bg-red-50 dark:bg-alert-red/10 p-4 rounded-lg border border-red-200 dark:border-alert-red/20">
                    <p className="text-sm text-red-700 dark:text-alert-red font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kiri: Daftar Antrean & ANPR */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">1. Identifikasi Otomatis (ANPR)</h2>
                        <AnprCapture onDetectResult={handleAnprResult} showProceedButton={false} />
                    </div>

                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">Pilih Manual Transaksi (Opsional)</h2>
                        <input
                            type="text"
                            placeholder="Cari No Plat atau Tiket..."
                            className="mb-4 bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-steel-700 rounded-lg custom-scrollbar">
                            {filteredTransactions.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 font-display">Tidak ada antrean timbang keluar.</div>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-steel-700">
                                    {filteredTransactions.map(t => (
                                        <li 
                                            key={t.id} 
                                            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-steel-700/50 ${selectedTransaction?.id === t.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                                            onClick={() => setSelectedTransaction(t)}
                                        >
                                            <div className="flex justify-between">
                                                <div>
                                                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-steel-100">{t.truckPlateNumber}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{t.ticketNumber} - <span className="font-sans">{t.customerName}</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-steel-100">{t.weighInKg} Kg</p>
                                                    <p className="text-xs font-display font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">Timbang Masuk</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Kanan: Timbangan & Konfirmasi */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">2. Timbangan Aktif</h2>
                        <WeighbridgeDisplay onWeightChange={handleWeightChange} />
                    </div>

                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">3. Konfirmasi Timbang Keluar</h2>
                        
                        {selectedTransaction ? (
                            <div className="bg-gray-50 dark:bg-steel-900 p-4 rounded-lg mb-4 text-sm space-y-2 border border-gray-200 dark:border-steel-700">
                                <div className="flex justify-between border-b border-gray-200 dark:border-steel-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-display font-semibold uppercase tracking-wide">Truk:</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-steel-100">{selectedTransaction.truckPlateNumber}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-steel-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-display font-semibold uppercase tracking-wide">Material:</span>
                                    <span className="font-semibold text-gray-900 dark:text-steel-100">{selectedTransaction.materialTypeName}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-steel-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-display font-semibold uppercase tracking-wide">Timbang Masuk:</span>
                                    <span className="font-mono font-bold text-gray-700 dark:text-steel-300">{selectedTransaction.weighInKg} Kg</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-display font-semibold uppercase tracking-wide">Timbang Keluar (Aktif):</span>
                                    <span className={`font-mono font-bold ${isWeightStable ? 'text-signal-green' : 'text-alert-red'}`}>
                                        {currentWeight} Kg
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-900 dark:text-white font-display font-bold uppercase tracking-wide text-lg">Estimasi Netto:</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-lg">
                                        {Math.abs(selectedTransaction.weighInKg - currentWeight)} Kg
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 dark:bg-safety-amber/10 p-4 rounded-lg mb-4 border border-yellow-200 dark:border-safety-amber/20">
                                <p className="text-yellow-700 dark:text-safety-amber text-sm font-display font-medium">Silakan identifikasi dengan ANPR atau pilih transaksi dari daftar di sebelah kiri.</p>
                            </div>
                        )}
                        
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isWeightStable || !selectedTransaction}
                            className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-display font-bold uppercase tracking-wide 
                                ${(!isWeightStable || isSubmitting || !selectedTransaction) ? 'bg-gray-300 dark:bg-steel-700 text-gray-500 cursor-not-allowed' : 'bg-signal-green hover:bg-green-500 text-steel-900 transition-colors'}`}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Timbang Keluar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
