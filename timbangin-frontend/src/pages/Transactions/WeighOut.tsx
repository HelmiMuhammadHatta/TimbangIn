import React, { useState, useEffect } from 'react';
import { AnprCapture } from '../../components/Weighbridge/AnprCapture';
import axiosInstance from '../../api/axiosInstance';
import { TicketPrint } from '../../components/Weighbridge/TicketPrint';
import * as signalR from '@microsoft/signalr';

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
        const found = pendingTransactions.find(t => t.truckPlateNumber.replace(/\s+/g, '') === plateNumber.replace(/\s+/g, ''));
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
            const res = await axiosInstance.post(`/api/weightransactions/${selectedTransaction.id}/complete`, {
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
            <h1 className="text-2xl font-semibold text-gray-900">Timbang Keluar (Weigh-Out)</h1>
            
            {error && (
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kiri: Daftar Antrean & ANPR */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">1. Identifikasi Otomatis (ANPR)</h2>
                        <AnprCapture onDetectResult={handleAnprResult} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">Pilih Manual Transaksi (Opsional)</h2>
                        <input
                            type="text"
                            placeholder="Cari No Plat atau Tiket..."
                            className="mb-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded">
                            {filteredTransactions.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">Tidak ada antrean timbang keluar.</div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {filteredTransactions.map(t => (
                                        <li 
                                            key={t.id} 
                                            className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedTransaction?.id === t.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                            onClick={() => setSelectedTransaction(t)}
                                        >
                                            <div className="flex justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{t.truckPlateNumber}</p>
                                                    <p className="text-xs text-gray-500">{t.ticketNumber} - {t.customerName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold">{t.weighInKg} Kg</p>
                                                    <p className="text-xs text-gray-400">Timbang Masuk</p>
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
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">2. Timbangan Aktif</h2>
                        <WeighbridgeDisplay onWeightChange={handleWeightChange} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">3. Konfirmasi Timbang Keluar</h2>
                        
                        {selectedTransaction ? (
                            <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm space-y-2 border border-gray-200">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Truk:</span>
                                    <span className="font-semibold">{selectedTransaction.truckPlateNumber}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Material:</span>
                                    <span className="font-semibold">{selectedTransaction.materialTypeName}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Timbang Masuk:</span>
                                    <span className="font-semibold text-gray-700">{selectedTransaction.weighInKg} Kg</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-500 font-medium">Timbang Keluar (Aktif):</span>
                                    <span className={`font-bold ${isWeightStable ? 'text-green-600' : 'text-red-600'}`}>
                                        {currentWeight} Kg
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-900 font-bold text-lg">Estimasi Netto:</span>
                                    <span className="text-blue-600 font-bold text-lg">
                                        {Math.abs(selectedTransaction.weighInKg - currentWeight)} Kg
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 p-4 rounded-md mb-4 text-yellow-700 text-sm">
                                Silakan identifikasi dengan ANPR atau pilih transaksi dari daftar di sebelah kiri.
                            </div>
                        )}
                        
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isWeightStable || !selectedTransaction}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                ${(!isWeightStable || isSubmitting || !selectedTransaction) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Timbang Keluar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Re-using the isolated WeighbridgeDisplay component
const WeighbridgeDisplay: React.FC<{ onWeightChange: (weight: number, isStable: boolean) => void }> = ({ onWeightChange }) => {
    const [weight, setWeight] = useState(0);
    const [isStable, setIsStable] = useState(false);
    const [status, setStatus] = useState('Disconnected');

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5266/hubs/weighbridge")
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveWeight", (data: any) => {
            setWeight(data.weight);
            setIsStable(data.isStable);
            onWeightChange(data.weight, data.isStable);
        });

        const start = async () => {
            try {
                await connection.start();
                setStatus('Connected');
            } catch (err) {
                console.error("SignalR Connection Error: ", err);
                setStatus('Error');
            }
        };

        start();

        return () => {
            connection.stop();
        };
    }, [onWeightChange]);

    return (
        <div className="bg-black rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-2 right-4 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-400">{status}</span>
            </div>
            
            <div className="text-center mt-4">
                <div className="text-gray-400 text-sm tracking-widest mb-2">DIGITAL INDICATOR</div>
                <div className={`font-mono text-5xl tracking-wider mb-2 ${isStable ? 'text-green-500' : 'text-red-500'}`}>
                    {weight.toString().padStart(5, '0')}
                </div>
                <div className="text-gray-500 text-lg">KG</div>
            </div>
        </div>
    );
};
