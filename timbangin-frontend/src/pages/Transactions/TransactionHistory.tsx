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
            let url = `/api/weightransactions?pageNumber=${page}&pageSize=10`;
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
            await axiosInstance.post(`/api/weightransactions/${id}/cancel`, { notes });
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
                        <h1 className="text-xl font-semibold text-gray-900">Riwayat Transaksi Timbang</h1>
                        <p className="mt-2 text-sm text-gray-700">Daftar seluruh transaksi yang masuk ke sistem.</p>
                    </div>
                </div>
                
                {/* Filters */}
                <div className="mt-4 flex flex-col md:flex-row gap-4 mb-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="Cari Plat Nomor atau No Tiket..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow text-sm hover:bg-blue-700">Cari</button>
                    </form>
                    
                    <select
                        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Memuat data...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiket</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truk / Pelanggan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Berat (In / Out / Netto)</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.ticketNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="font-semibold text-gray-900">{t.truckPlateNumber}</div>
                                                <div className="text-xs">{t.customerName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.materialTypeName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>{new Date(t.weighInTimestamp).toLocaleDateString('id-ID')}</div>
                                                <div className="text-xs">{new Date(t.weighInTimestamp).toLocaleTimeString('id-ID')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                <div>In: {t.weighInKg} Kg</div>
                                                {t.weighOutKg !== null && <div>Out: {t.weighOutKg} Kg</div>}
                                                {t.nettoKg !== null && <div className="font-bold text-blue-600 mt-1">Netto: {t.nettoKg} Kg</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${t.status === 'Selesai' ? 'bg-green-100 text-green-800' : 
                                                    t.status === 'MenungguTimbangKeluar' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-red-100 text-red-800'}`}>
                                                    {t.status === 'MenungguTimbangKeluar' ? 'Pending' : t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handlePrintClick(t)} className="text-blue-600 hover:text-blue-900 mx-2">Print</button>
                                                {t.status === 'MenungguTimbangKeluar' && (
                                                    <button onClick={() => handleCancelTransaction(t.id)} className="text-red-600 hover:text-red-900 mx-2">Batal</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data ditemukan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-700">Halaman {page} dari {totalPages || 1}</span>
                    <div className="space-x-2">
                        <button 
                            disabled={page <= 1} 
                            onClick={() => setPage(p => p - 1)}
                            className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-sm text-sm disabled:opacity-50"
                        >
                            Sebelumnya
                        </button>
                        <button 
                            disabled={page >= totalPages || totalPages === 0} 
                            onClick={() => setPage(p => p + 1)}
                            className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded shadow-sm text-sm disabled:opacity-50"
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
