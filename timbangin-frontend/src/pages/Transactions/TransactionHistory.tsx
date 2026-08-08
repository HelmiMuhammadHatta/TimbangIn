import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { TicketPrint } from '../../components/Weighbridge/TicketPrint';

export const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // For printing
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter]);

    // Handle search debounce or manual trigger, here we'll just use a button or enter key for simplicity.
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // reset to page 1 on new search
        fetchTransactions();
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let url = `/weightransactions?pageNumber=${page}&pageSize=10`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (statusFilter) url += `&status=${statusFilter}`;

            const res = await axiosInstance.get(url);
            setTransactions(res.data.data.items);
            setTotalPages(Math.ceil(res.data.data.totalCount / 10));
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintClick = (t: any) => {
        setSelectedTransaction(t);
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500); // Wait for render
    };

    const handleCancelTransaction = async (id: string) => {
        const notes = window.prompt("Masukkan alasan pembatalan:");
        if (notes === null) return; // User cancelled prompt
        if (!notes) {
            alert("Alasan harus diisi!");
            return;
        }
        
        try {
            await axiosInstance.post(`/weightransactions/${id}/cancel`, { notes });
            alert("Transaksi dibatalkan.");
            fetchTransactions();
        } catch (err: any) {
            alert("Gagal: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-steel-100 uppercase tracking-wide">Riwayat Transaksi Timbang</h1>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-display">Daftar seluruh transaksi yang masuk ke sistem.</p>
                    </div>
                </div>
                
                <div className="mt-4 flex flex-col md:flex-row gap-4 mb-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="Cari Plat Nomor atau No Tiket..."
                            className="block w-full bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber p-2.5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="bg-steel-800 hover:bg-steel-700 dark:bg-steel-700 dark:hover:bg-steel-600 text-white font-display font-semibold px-4 py-2 rounded-lg shadow-sm text-sm uppercase tracking-wide transition-colors">Cari</button>
                    </form>
                    
                    <select
                        className="block w-48 bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber p-2.5"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Semua Status</option>
                        <option value="1">Menunggu Keluar</option>
                        <option value="2">Selesai</option>
                        <option value="3">Dibatalkan</option>
                    </select>
                </div>

                <div className="bg-white dark:bg-steel-800 shadow-sm overflow-hidden sm:rounded-xl border border-gray-200 dark:border-steel-700">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400 font-display uppercase tracking-wider">Memuat data...</div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-steel-700">
                                <thead className="bg-gray-50 dark:bg-steel-900 border-b border-gray-200 dark:border-steel-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiket</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Truk / Pelanggan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Material</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waktu</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Berat (In / Out / Netto)</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-steel-800 divide-y divide-gray-200 dark:divide-steel-700">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-steel-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900 dark:text-steel-100">{t.ticketNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="font-mono font-bold text-gray-900 dark:text-steel-100">{t.truckPlateNumber}</div>
                                                <div className="text-xs font-sans">{t.customerName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-medium">{t.materialTypeName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                <div>{new Date(t.weighInTimestamp).toLocaleDateString('id-ID')}</div>
                                                <div className="text-xs">{new Date(t.weighInTimestamp).toLocaleTimeString('id-ID')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400 font-mono">
                                                <div>In: {t.weighInKg} Kg</div>
                                                {t.weighOutKg !== null && <div>Out: {t.weighOutKg} Kg</div>}
                                                {t.nettoKg !== null && <div className="font-bold text-blue-600 dark:text-blue-400 mt-1 font-display tracking-wider">NETTO: <span className="font-mono">{t.nettoKg} Kg</span></div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-display">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold uppercase tracking-wider rounded-full 
                                                    ${t.status === 'Selesai' ? 'bg-signal-green/20 text-green-700 dark:text-signal-green border border-signal-green/30' : 
                                                    t.status === 'MenungguTimbangKeluar' ? 'bg-safety-amber/20 text-yellow-700 dark:text-safety-amber border border-safety-amber/30' : 
                                                    'bg-alert-red/20 text-red-700 dark:text-alert-red border border-alert-red/30'}`}>
                                                    {t.status === 'MenungguTimbangKeluar' ? 'Pending' : t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium font-display">
                                                <button onClick={() => handlePrintClick(t)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mx-2 uppercase tracking-wide text-xs font-bold">Print</button>
                                                {t.status === 'MenungguTimbangKeluar' && (
                                                    <button onClick={() => handleCancelTransaction(t.id)} className="text-alert-red hover:text-red-900 dark:hover:text-red-400 mx-2 uppercase tracking-wide text-xs font-bold">Batal</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 font-display">Tidak ada data ditemukan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center font-display">
                    <span className="text-sm text-gray-700 dark:text-gray-400 font-medium">Halaman {page} dari {totalPages || 1}</span>
                    <div className="space-x-2">
                        <button 
                            disabled={page <= 1} 
                            onClick={() => setPage(p => p - 1)}
                            className="bg-white dark:bg-steel-800 border border-gray-300 dark:border-steel-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg shadow-sm text-sm disabled:opacity-50 font-semibold uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-steel-700 transition-colors"
                        >
                            Sebelumnya
                        </button>
                        <button 
                            disabled={page >= totalPages || totalPages === 0} 
                            onClick={() => setPage(p => p + 1)}
                            className="bg-white dark:bg-steel-800 border border-gray-300 dark:border-steel-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg shadow-sm text-sm disabled:opacity-50 font-semibold uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-steel-700 transition-colors"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden Print Section */}
            {isPrinting && <TicketPrint transaction={selectedTransaction} />}
        </div>
    );
};
