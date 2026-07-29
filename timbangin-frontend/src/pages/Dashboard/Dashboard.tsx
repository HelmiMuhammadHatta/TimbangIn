import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import * as signalR from '@microsoft/signalr';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Activity, Truck, Scale, Clock, CheckCircle } from 'lucide-react';

interface DashboardSummary {
    totalTransactionsToday: number;
    trucksOnSite: number;
    averageProcessingTimeMinutes: number;
    totalNettoTodayByMaterial: { materialName: string, totalNettoKg: number }[];
    transactionsPerHour: { hour: number, count: number }[];
    topCustomersThisMonth: { customerName: string, totalVolumeKg: number }[];
}

export const Dashboard = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [liveFeed, setLiveFeed] = useState<any[]>([]);
    const [trucksOnSiteList, setTrucksOnSiteList] = useState<any[]>([]);
    const [newTransactionAnim, setNewTransactionAnim] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchSummary = async () => {
        try {
            const res = await axiosInstance.get('/api/dashboard/summary');
            setSummary(res.data.data);
            
            // Also fetch pending transactions for "Truck di Lokasi" panel
            const pendingRes = await axiosInstance.get('/api/weightransactions/pending');
            setTrucksOnSiteList(pendingRes.data.data);
        } catch (err) {
            console.error('Failed to fetch dashboard summary', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();

        // Timer for real-time counters
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5266/hubs/dashboard")
            .withAutomaticReconnect()
            .build();

        connection.on("NewTransactionEvent", (transaction: any) => {
            // Trigger animation
            setNewTransactionAnim(true);
            setTimeout(() => setNewTransactionAnim(false), 2000);

            // Add to live feed (keep last 10)
            setLiveFeed(prev => [transaction, ...prev].slice(0, 10));

            // Refresh summary and trucks on site
            fetchSummary();
        });

        connection.start().catch(err => console.error('Dashboard SignalR Error: ', err));

        return () => {
            connection.stop();
        };
    }, []);

    if (loading || !summary) {
        return <div className="p-8 text-center text-gray-500">Memuat Dashboard...</div>;
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Utama</h1>
                    <p className="text-sm text-gray-500">Monitoring real-time aktivitas timbangan</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span>Live Updates Aktif</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Transaksi Hari Ini</h3>
                        <p className="text-3xl font-bold text-gray-800">{summary.totalTransactionsToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Netto Hari Ini</h3>
                        <p className="text-3xl font-bold text-gray-800">
                            {summary.totalNettoTodayByMaterial.reduce((acc, curr) => acc + curr.totalNettoKg, 0).toLocaleString('id-ID')}
                            <span className="text-sm text-gray-500 ml-1 font-normal">Kg</span>
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <Scale size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Truk di Lokasi</h3>
                        <p className="text-3xl font-bold text-gray-800">{summary.trucksOnSite}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                        <Truck size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Rata-rata Waktu Proses</h3>
                        <p className="text-3xl font-bold text-gray-800">
                            {summary.averageProcessingTimeMinutes}
                            <span className="text-sm text-gray-500 ml-1 font-normal">Menit</span>
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Volume Transaksi per Jam (Hari Ini)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={summary.transactionsPerHour}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} tick={{fontSize: 12}} />
                                <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                                <RechartsTooltip 
                                    labelFormatter={(label) => `Jam: ${label}:00`}
                                    formatter={(value) => [`${value} Transaksi`, 'Volume']}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Perbandingan Netto per Material (Hari Ini)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary.totalNettoTodayByMaterial}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="materialName" tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <RechartsTooltip formatter={(value: any) => [`${(value || 0).toLocaleString()} Kg`, 'Total Netto']} />
                                <Bar dataKey="totalNettoKg" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lists Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Live Feed */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Live Feed (Terbaru)</h3>
                        {newTransactionAnim && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full animate-bounce">
                                Baru!
                            </span>
                        )}
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {liveFeed.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">Belum ada aktivitas real-time.</p>
                        ) : (
                            liveFeed.map((t, i) => (
                                <div key={`${t.id}-${i}`} className={`flex border-l-4 p-3 bg-gray-50 rounded-r shadow-sm ${t.status === 'Selesai' ? 'border-green-500' : 'border-blue-500'}`}>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">{t.truckPlateNumber}</p>
                                        <p className="text-xs text-gray-500">{t.ticketNumber} - {t.customerName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold">{t.status === 'Selesai' ? 'Timbang Keluar' : 'Timbang Masuk'}</p>
                                        <p className="text-xs text-gray-500">{new Date(t.status === 'Selesai' ? t.weighOutTimestamp : t.weighInTimestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Trucks on Site */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Truk di Lokasi (Menunggu)</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {trucksOnSiteList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <CheckCircle size={32} className="mb-2" />
                                <p className="text-sm">Tidak ada antrean truk.</p>
                            </div>
                        ) : (
                            trucksOnSiteList.map(t => {
                                const diffMs = currentTime.getTime() - new Date(t.weighInTimestamp).getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMins / 60);
                                const mins = diffMins % 60;
                                
                                return (
                                    <div key={t.id} className="border border-gray-200 p-3 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-sm">{t.truckPlateNumber}</p>
                                            <p className="text-xs text-gray-500">{t.materialTypeName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xs font-medium px-2 py-1 rounded-full ${diffMins > 60 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {diffHours > 0 ? `${diffHours}j ` : ''}{mins}m
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">In: {new Date(t.weighInTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Top Customers Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Pelanggan (Bulan Ini)</h3>
                    <div className="h-64">
                        {summary.topCustomersThisMonth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary.topCustomersThisMonth}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="totalVolumeKg"
                                        nameKey="customerName"
                                    >
                                        {summary.topCustomersThisMonth.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: any) => [`${(value || 0).toLocaleString()} Kg`, 'Volume']} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                Belum ada data bulan ini.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
