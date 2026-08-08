import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnprCapture } from '../../components/Weighbridge/AnprCapture';
import axiosInstance from '../../api/axiosInstance';
import { TicketPrint } from '../../components/Weighbridge/TicketPrint';
import WeighbridgeDisplay from '../../components/Weighbridge/WeighbridgeDisplay';
export const WeighIn: React.FC = () => {
    const location = useLocation();
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

    // Handle pre-filling from GateMonitor navigation
    useEffect(() => {
        if (location.state?.truckId) {
            setSelectedTruckId(location.state.truckId);
        }
        if (location.state?.customerId) {
            setSelectedCustomerId(location.state.customerId);
        }
    }, [location.state]);

    const fetchMasterData = async () => {
        try {
            const [custRes, matRes, truckRes] = await Promise.all([
                axiosInstance.get('/customers?pageSize=100'),
                axiosInstance.get('/materialtypes?pageSize=100'),
                axiosInstance.get('/trucks?pageSize=100')
            ]);
            const loadedCustomers = custRes.data.data.items || [];
            const loadedMaterials = matRes.data.data.items || [];
            const loadedTrucks = truckRes.data.data.items || [];

            setCustomers(loadedCustomers);
            setMaterials(loadedMaterials);
            setTrucks(loadedTrucks);

            // If arrived with state truckId but not in truck list yet, fetch it
            if (location.state?.truckId) {
                const found = loadedTrucks.find((t: any) => t.id === location.state.truckId);
                if (found) {
                    setSelectedTruckId(found.id);
                    if (found.customerId) setSelectedCustomerId(found.customerId);
                } else if (location.state?.plateNumber) {
                    try {
                        const cleanTarget = location.state.plateNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                        const singleRes = await axiosInstance.get(`/trucks/by-plate/${cleanTarget}`);
                        if (singleRes.data.success && singleRes.data.data) {
                            const newT = singleRes.data.data;
                            setTrucks((prev: any[]) => [...prev, newT]);
                            setSelectedTruckId(newT.id);
                            if (newT.customerId) setSelectedCustomerId(newT.customerId);
                        }
                    } catch {
                        // ignore
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load master data', err);
        }
    };

    const handleAnprResult = async (plateNumber: string, _photoPath: string) => {
        const cleanTarget = plateNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const truck = trucks.find(t => 
            t.plateNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanTarget ||
            (t.plateNumberNormalized && t.plateNumberNormalized.toUpperCase() === cleanTarget)
        );

        if (truck) {
            setSelectedTruckId(truck.id);
            setSelectedCustomerId(truck.customerId);
            setError('');
        } else {
            try {
                const res = await axiosInstance.get(`/trucks/by-plate/${cleanTarget}`);
                if (res.data.success && res.data.data) {
                    const t = res.data.data;
                    setSelectedTruckId(t.id);
                    setSelectedCustomerId(t.customerId);
                    setError('');
                    setTrucks(prev => prev.some(x => x.id === t.id) ? prev : [...prev, t]);
                } else {
                    setError(`Truk dengan plat ${plateNumber} tidak ditemukan di Master Data.`);
                }
            } catch {
                setError(`Truk dengan plat ${plateNumber} tidak ditemukan di Master Data.`);
            }
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
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-steel-100 uppercase tracking-wide">Timbang Masuk (Weigh-In)</h1>
            
            {error && (
                <div className="bg-red-50 dark:bg-alert-red/10 p-4 rounded-lg border border-red-200 dark:border-alert-red/20">
                    <p className="text-sm text-red-700 dark:text-alert-red font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kiri: ANPR & Data Form */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">1. Identifikasi Truk (ANPR)</h2>
                        <AnprCapture onDetectResult={handleAnprResult} showProceedButton={false} />
                    </div>

                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">2. Detail Transaksi</h2>
                        <form id="weighInForm" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-steel-100">Truk / Plat Nomor</label>
                                <select
                                    value={selectedTruckId}
                                    onChange={(e) => setSelectedTruckId(e.target.value)}
                                    required
                                    className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5 mt-1"
                                >
                                    <option value="">-- Pilih Truk --</option>
                                    {trucks.map(t => (
                                        <option key={t.id} value={t.id}>{t.plateNumber} ({t.driverName})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-steel-100">Pelanggan</label>
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    required
                                    className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5 mt-1"
                                >
                                    <option value="">-- Pilih Pelanggan --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-steel-100">Material</label>
                                <select
                                    value={selectedMaterialId}
                                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                                    required
                                    className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5 mt-1"
                                >
                                    <option value="">-- Pilih Material --</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-steel-100">Tipe Transaksi</label>
                                <select
                                    value={transactionType}
                                    onChange={(e) => setTransactionType(e.target.value)}
                                    required
                                    className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5 mt-1"
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
                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">3. Timbangan Aktif</h2>
                        <WeighbridgeDisplay onWeightChange={handleWeightChange} />
                    </div>

                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4 tracking-wide uppercase">4. Konfirmasi</h2>
                        <div className="bg-gray-50 dark:bg-steel-900 p-4 rounded-lg border border-gray-200 dark:border-steel-700 mb-4">
                            <p className="text-sm font-display text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Berat Masuk:</p>
                            <p className={`text-3xl font-mono font-bold ${isWeightStable ? 'text-signal-green' : 'text-alert-red'}`}>
                                {currentWeight} Kg
                            </p>
                            {!isWeightStable && (
                                <p className="text-xs text-alert-red mt-1 animate-pulse font-display">Menunggu berat stabil...</p>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            form="weighInForm"
                            disabled={isSubmitting || !isWeightStable}
                            className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-display font-bold uppercase tracking-wide 
                                ${(!isWeightStable || isSubmitting) ? 'bg-gray-300 dark:bg-steel-700 text-gray-500 cursor-not-allowed' : 'bg-signal-green hover:bg-green-500 text-steel-900 transition-colors'}`}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Timbang Masuk'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
