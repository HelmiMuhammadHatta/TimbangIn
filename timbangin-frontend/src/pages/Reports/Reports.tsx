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
    const today = new Date().toISOString().split('T')[0];
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

            const res = await axiosInstance.get(`/api/reports/transactions?${params.toString()}`);
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

            const res = await axiosInstance.get(`/api/reports/transactions/export-excel?${params.toString()}`, {
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

            const res = await axiosInstance.get(`/api/reports/transactions/export-pdf?${params.toString()}`, {
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Transaksi</h1>
                    <p className="text-sm text-gray-500">Filter, preview, dan export rekapitulasi data timbang</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={handleExportExcel} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                        <FileSpreadsheet size={18} />
                        <span>Export Excel</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                        <Download size={18} />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mulai Tanggal</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filter.startDate}
                            onChange={e => setFilter({...filter, startDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filter.endDate}
                            onChange={e => setFilter({...filter, endDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filter.customerId || ''}
                            onChange={e => setFilter({...filter, customerId: e.target.value})}
                        >
                            <option value="">Semua Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filter.materialTypeId || ''}
                            onChange={e => setFilter({...filter, materialTypeId: e.target.value})}
                        >
                            <option value="">Semua Material</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors disabled:bg-blue-300"
                    >
                        <Search size={18} />
                        <span>{loading ? 'Memuat...' : 'Cari Data'}</span>
                    </button>
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Transaksi</h3>
                        <p className="text-3xl font-bold text-gray-800">{summary.totalTransactions}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Netto Filtered</h3>
                        <p className="text-3xl font-bold text-gray-800">
                            {summary.totalNettoKg.toLocaleString('id-ID')} <span className="text-sm font-normal text-gray-500">Kg</span>
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Rata-rata Netto</h3>
                        <p className="text-3xl font-bold text-gray-800">
                            {summary.averageNettoKg.toLocaleString('id-ID', {maximumFractionDigits:2})} <span className="text-sm font-normal text-gray-500">Kg</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Preview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                        <FileText size={18} className="text-blue-500 mr-2" />
                        Preview Laporan
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plat</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto (Kg)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tara (Kg)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Netto (Kg)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                                        Tidak ada data yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t, i) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.ticketNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(t.weighInTimestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.truckPlateNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.materialTypeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{t.weighInKg.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{(t.weighOutKg || 0).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{(t.nettoKg || 0).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                t.status === 'Selesai' ? 'bg-green-100 text-green-800' :
                                                t.status === 'Dibatalkan' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
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
