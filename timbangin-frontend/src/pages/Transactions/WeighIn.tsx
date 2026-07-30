import React, { useState, useEffect } from 'react';
import { AnprCapture } from '../../components/Weighbridge/AnprCapture';
import axiosInstance from '../../api/axiosInstance';
import { TicketPrint } from '../../components/Weighbridge/TicketPrint';

export const WeighIn: React.FC = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [trucks, setTrucks] = useState<any[]>([]);

    const [selectedTruckId, setSelectedTruckId] = useState<string>('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [transactionType, setTransactionType] = useState<string>('1'); // 1 = MasukIsiKeluarKosong, 2 = MasukKosongKeluarIsi
    
    const [currentWeight, setCurrentWeight] = useState<number>(0);
    const [isWeightStable, setIsWeightStable] = useState<boolean>(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successTransaction, setSuccessTransaction] = useState<any>(null);

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [custRes, matRes, truckRes] = await Promise.all([
                axiosInstance.get('/customers?pageSize=100'),
                axiosInstance.get('/materialtypes?pageSize=100'),
                axiosInstance.get('/trucks?pageSize=100')
            ]);
            setCustomers(custRes.data.data.items);
            setMaterials(matRes.data.data.items);
            setTrucks(truckRes.data.data.items);
        } catch (err) {
            console.error('Failed to load master data', err);
        }
    };

    const handleAnprResult = (plateNumber: string, _photoPath: string) => {
        const truck = trucks.find(t => t.plateNumber.replace(/\s+/g, '') === plateNumber.replace(/\s+/g, ''));
        if (truck) {
            setSelectedTruckId(truck.id);
            setSelectedCustomerId(truck.customerId);
            setError('');
        } else {
            setError(`Truk dengan plat ${plateNumber} tidak ditemukan di Master Data.`);
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

        if (!selectedTruckId || !selectedCustomerId || !selectedMaterialId) {
            setError('Harap lengkapi semua data truk, pelanggan, dan material.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axiosInstance.post('/weightransactions/start', {
                truckId: selectedTruckId,
                customerId: selectedCustomerId,
                materialTypeId: selectedMaterialId,
                transactionType: parseInt(transactionType),
                weighInKg: currentWeight,
                weighInPhotoPath: '' // Pass photo path if you store ANPR state locally
            });
            
            if (res.data.success) {
                setSuccessTransaction(res.data.data);
            } else {
                setError(res.data.message || 'Gagal memulai transaksi.');
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Timbang Masuk Berhasil!</h2>
                        <p className="text-gray-600 mb-6">No. Tiket: <span className="font-semibold">{successTransaction.ticketNumber}</span></p>
                        
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
                                    setSelectedTruckId('');
                                    setSelectedMaterialId('');
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                </div>
                {/* Komponen cetak tersembunyi kecuali saat print */}
                <TicketPrint transaction={successTransaction} />
            </div>
        );
    }

    return (
        <div className="space-y-6 print:hidden">
            <h1 className="text-2xl font-semibold text-gray-900">Timbang Masuk (Weigh-In)</h1>
            
            {error && (
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kiri: ANPR & Data Form */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">1. Identifikasi Truk (ANPR)</h2>
                        <AnprCapture onDetectResult={handleAnprResult} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">2. Detail Transaksi</h2>
                        <form id="weighInForm" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Truk / Plat Nomor</label>
                                <select
                                    value={selectedTruckId}
                                    onChange={(e) => setSelectedTruckId(e.target.value)}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">-- Pilih Truk --</option>
                                    {trucks.map(t => (
                                        <option key={t.id} value={t.id}>{t.plateNumber} ({t.driverName})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pelanggan</label>
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">-- Pilih Pelanggan --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Material</label>
                                <select
                                    value={selectedMaterialId}
                                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">-- Pilih Material --</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipe Transaksi</label>
                                <select
                                    value={transactionType}
                                    onChange={(e) => setTransactionType(e.target.value)}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="1">Masuk Isi → Keluar Kosong (Bongkar)</option>
                                    <option value="2">Masuk Kosong → Keluar Isi (Muat)</option>
                                </select>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Kanan: Weighbridge Display */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">3. Timbangan Aktif</h2>
                        {/* Re-use WeighbridgeMonitor logic or integrate SignalR here.
                            For simplicity, we assume WeighbridgeMonitor exposes its state 
                            or we duplicate the SignalR hook. Let's just create a self-contained listener. */}
                        <WeighbridgeDisplay onWeightChange={handleWeightChange} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-medium mb-4">4. Konfirmasi</h2>
                        <div className="bg-gray-50 p-4 rounded-md mb-4">
                            <p className="text-sm text-gray-500">Berat Masuk:</p>
                            <p className={`text-3xl font-mono font-bold ${isWeightStable ? 'text-green-600' : 'text-red-600'}`}>
                                {currentWeight} Kg
                            </p>
                            {!isWeightStable && (
                                <p className="text-xs text-red-500 mt-1 animate-pulse">Menunggu berat stabil...</p>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            form="weighInForm"
                            disabled={isSubmitting || !isWeightStable}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                ${(!isWeightStable || isSubmitting) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Timbang Masuk'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// A helper component to subscribe to SignalR and display weight
import * as signalR from '@microsoft/signalr';

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
                <div className={`font-mono text-5xl md:text-7xl tracking-wider mb-2 ${isStable ? 'text-green-500' : 'text-red-500'}`}>
                    {weight.toString().padStart(5, '0')}
                </div>
                <div className="text-gray-500 text-lg">KG</div>
            </div>

            <div className="mt-8 flex justify-between px-4 border-t border-gray-800 pt-4">
                <div className="text-center">
                    <div className="text-gray-500 text-xs mb-1">STABLE</div>
                    <div className={`w-3 h-3 rounded-full mx-auto ${isStable ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                </div>
                <div className="text-center">
                    <div className="text-gray-500 text-xs mb-1">ZERO</div>
                    <div className={`w-3 h-3 rounded-full mx-auto ${weight === 0 ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
                </div>
            </div>
        </div>
    );
};
