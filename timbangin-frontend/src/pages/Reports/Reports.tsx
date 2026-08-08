import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { FileText, Download, FileSpreadsheet, Search } from 'lucide-react';

interface ReportFilter {
    startDate: string;
    endDate: string;
    customerId?: string;
    materialTypeId?: string;
    status?: string;
}

export const Reports = () => {
    const getLocalToday = () => {
        const date = new Date();
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - userTimezoneOffset).toISOString().split('T')[0];
    };
    const today = getLocalToday();
    const [filter, setFilter] = useState<ReportFilter>({
        startDate: today,
        endDate: today
    });

    const [summary, setSummary] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Options for dropdowns
    const [customers, setCustomers] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    useEffect(() => {
        // Fetch lookup data
        axiosInstance.get('/customers?pageNumber=1&pageSize=100').then(res => setCustomers(res.data.data.items));
        axiosInstance.get('/materialtypes?pageNumber=1&pageSize=100').then(res => setMaterials(res.data.data.items));
        
        // Auto load initial data
        handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.startDate) params.append('startDate', filter.startDate);
            if (filter.endDate) params.append('endDate', filter.endDate);
            if (filter.customerId) params.append('customerId', filter.customerId);
            if (filter.materialTypeId) params.append('materialTypeId', filter.materialTypeId);
            if (filter.status) params.append('status', filter.status);

            const res = await axiosInstance.get(`/reports/transactions?${params.toString()}`);
            setSummary(res.data.data.summary);
            setTransactions(res.data.data.transactions);
        } catch (error) {
            console.error('Error fetching report', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.startDate) params.append('startDate', filter.startDate);
            if (filter.endDate) params.append('endDate', filter.endDate);
            if (filter.customerId) params.append('customerId', filter.customerId);
            if (filter.materialTypeId) params.append('materialTypeId', filter.materialTypeId);
            if (filter.status) params.append('status', filter.status);

            const res = await axiosInstance.get(`/reports/transactions/export-excel?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Error exporting Excel', error);
        }
    };

    const handleExportPdf = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.startDate) params.append('startDate', filter.startDate);
            if (filter.endDate) params.append('endDate', filter.endDate);
            if (filter.customerId) params.append('customerId', filter.customerId);
            if (filter.materialTypeId) params.append('materialTypeId', filter.materialTypeId);
            if (filter.status) params.append('status', filter.status);

            const res = await axiosInstance.get(`/reports/transactions/export-pdf?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Error exporting PDF', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-steel-100 uppercase tracking-wide">Laporan Transaksi</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-display">Filter, preview, dan export rekapitulasi data timbang</p>
                </div>
                <div className="flex space-x-3 w-full md:w-auto">
                    <button onClick={handleExportExcel} className="flex-1 md:flex-none flex justify-center items-center space-x-2 bg-signal-green hover:bg-green-500 text-steel-900 font-display font-bold shadow-sm uppercase tracking-wide text-sm px-4 py-2 rounded-lg transition-colors">
                        <FileSpreadsheet size={18} />
                        <span>Export Excel</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex-1 md:flex-none flex justify-center items-center space-x-2 bg-white dark:bg-steel-800 hover:bg-gray-50 dark:hover:bg-steel-700 border border-gray-300 dark:border-steel-600 text-gray-900 dark:text-white font-display font-bold shadow-sm uppercase tracking-wide text-sm px-4 py-2 rounded-lg transition-colors">
                        <Download size={18} />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-steel-100 mb-1">Mulai Tanggal</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber px-3 py-2"
                            value={filter.startDate}
                            onChange={e => setFilter({...filter, startDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-steel-100 mb-1">Sampai Tanggal</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber px-3 py-2"
                            value={filter.endDate}
                            onChange={e => setFilter({...filter, endDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-steel-100 mb-1">Customer</label>
                        <select 
                            className="w-full bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber px-3 py-2"
                            value={filter.customerId || ''}
                            onChange={e => setFilter({...filter, customerId: e.target.value})}
                        >
                            <option value="">Semua Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-steel-100 mb-1">Material</label>
                        <select 
                            className="w-full bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber px-3 py-2"
                            value={filter.materialTypeId || ''}
                            onChange={e => setFilter({...filter, materialTypeId: e.target.value})}
                        >
                            <option value="">Semua Material</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-steel-100 mb-1">Status</label>
                        <select 
                            className="w-full bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber px-3 py-2"
                            value={filter.status || ''}
                            onChange={e => setFilter({...filter, status: e.target.value})}
                        >
                            <option value="">Semua Status</option>
                            <option value="MenungguTimbangKeluar">Menunggu Timbang Keluar</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 bg-steel-800 hover:bg-steel-700 dark:bg-steel-700 dark:hover:bg-steel-600 text-white font-display font-bold uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Search size={18} />
                        <span>{loading ? 'Memuat...' : 'Cari Data'}</span>
                    </button>
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-display font-semibold uppercase tracking-wide mb-1">Total Transaksi</h3>
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-steel-100">{summary.totalTransactions}</p>
                    </div>
                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-display font-semibold uppercase tracking-wide mb-1">Total Netto Filtered</h3>
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-steel-100">
                            {summary.totalNettoKg.toLocaleString('id-ID')} <span className="text-sm font-sans font-normal text-gray-500 dark:text-gray-400">Kg</span>
                        </p>
                    </div>
                    <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-display font-semibold uppercase tracking-wide mb-1">Rata-rata Netto</h3>
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-steel-100">
                            {summary.averageNettoKg.toLocaleString('id-ID', {maximumFractionDigits:2})} <span className="text-sm font-sans font-normal text-gray-500 dark:text-gray-400">Kg</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Preview Table */}
            <div className="bg-white dark:bg-steel-800 rounded-xl shadow-sm border border-gray-200 dark:border-steel-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-steel-700 flex items-center justify-between">
                    <h3 className="font-display font-bold text-gray-900 dark:text-steel-100 flex items-center uppercase tracking-wide">
                        <FileText size={18} className="text-safety-amber mr-2" />
                        Preview Laporan
                    </h3>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-steel-700">
                        <thead className="bg-gray-50 dark:bg-steel-900 border-b border-gray-200 dark:border-steel-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket</th>
                                <th className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plat</th>
                                <th className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Material</th>
                                <th className="px-6 py-3 text-right text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bruto (Kg)</th>
                                <th className="px-6 py-3 text-right text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tara (Kg)</th>
                                <th className="px-6 py-3 text-right text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Netto (Kg)</th>
                                <th className="px-6 py-3 text-center text-xs font-display font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-steel-800 divide-y divide-gray-200 dark:divide-steel-700">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 font-display">
                                        Tidak ada data yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t, i) => (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-steel-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{i + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900 dark:text-steel-100">{t.ticketNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {new Date(t.weighInTimestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-steel-100 font-mono font-bold">{t.truckPlateNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.materialTypeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono text-right">{t.weighInKg.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono text-right">{(t.weighOutKg || 0).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-blue-600 dark:text-blue-400 text-right">{(t.nettoKg || 0).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center font-display">
                                            <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                                                t.status === 'Selesai' ? 'bg-signal-green/20 text-green-700 dark:text-signal-green border border-signal-green/30' :
                                                t.status === 'Dibatalkan' ? 'bg-alert-red/20 text-red-700 dark:text-alert-red border border-alert-red/30' :
                                                'bg-safety-amber/20 text-yellow-700 dark:text-safety-amber border border-safety-amber/30'
                                            }`}>
                                                {t.status === 'MenungguTimbangKeluar' ? 'Menunggu' : t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
