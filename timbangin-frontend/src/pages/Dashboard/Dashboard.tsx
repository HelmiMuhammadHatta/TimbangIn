import React, { useState, useEffect } from 'react';
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
            const res = await axiosInstance.get('/dashboard/summary');
            setSummary(res.data.data);
            
            // Also fetch pending transactions for "Truck di Lokasi" panel
            const pendingRes = await axiosInstance.get('/weightransactions/pending');
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
                    <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-steel-100">Dashboard Utama</h1>
                    <p className="text-sm font-display text-gray-500 dark:text-gray-400 mt-1">Monitoring real-time aktivitas timbangan</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 dark:bg-signal-green/10 dark:text-signal-green px-3 py-1 rounded-full border border-green-100 dark:border-signal-green/20">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-signal-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 dark:bg-signal-green"></span>
                    </span>
                    <span className="font-display font-semibold tracking-wide uppercase text-xs">Live Updates Aktif</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 font-display text-sm font-semibold tracking-wide uppercase mb-1">Total Transaksi Hari Ini</h3>
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-steel-100">{summary.totalTransactionsToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 font-display text-sm font-semibold tracking-wide uppercase mb-1">Total Netto Hari Ini</h3>
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-steel-100">
                            {summary.totalNettoTodayByMaterial.reduce((acc, curr) => acc + curr.totalNettoKg, 0).toLocaleString('id-ID')}
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1 font-normal">Kg</span>
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-signal-green/20 text-green-600 dark:text-signal-green rounded-full flex items-center justify-center">
                        <Scale size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 font-display text-sm font-semibold tracking-wide uppercase mb-1">Truk di Lokasi</h3>
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-steel-100">{summary.trucksOnSite}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-safety-amber/20 text-yellow-600 dark:text-safety-amber rounded-full flex items-center justify-center">
                        <Truck size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 font-display text-sm font-semibold tracking-wide uppercase mb-1">Rata-rata Waktu Proses</h3>
                        <p className="text-3xl font-mono font-bold text-gray-900 dark:text-steel-100">
                            {summary.averageProcessingTimeMinutes}
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1 font-normal">Menit</span>
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900">
                    <h3 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4">Volume Transaksi per Jam (Hari Ini)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={summary.transactionsPerHour}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4B5563" opacity={0.3} />
                                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                                <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                                <RechartsTooltip 
                                    labelFormatter={(label) => `Jam: ${label}:00`}
                                    formatter={(value) => [`${value} Transaksi`, 'Volume']}
                                    contentStyle={{ backgroundColor: '#1C2128', borderColor: '#2D3339', color: '#EDEEF0', borderRadius: '8px' }}
                                    itemStyle={{ color: '#F2A900' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#F2A900" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900">
                    <h3 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4">Perbandingan Netto per Material (Hari Ini)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary.totalNettoTodayByMaterial}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4B5563" opacity={0.3} />
                                <XAxis dataKey="materialName" tick={{fontSize: 12, fill: '#9CA3AF'}} />
                                <YAxis tick={{fontSize: 12, fill: '#9CA3AF'}} />
                                <RechartsTooltip 
                                    formatter={(value: any) => [`${(value || 0).toLocaleString()} Kg`, 'Total Netto']} 
                                    contentStyle={{ backgroundColor: '#1C2128', borderColor: '#2D3339', color: '#EDEEF0', borderRadius: '8px' }}
                                    itemStyle={{ color: '#3DDC84' }}
                                />
                                <Bar dataKey="totalNettoKg" fill="#3DDC84" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lists Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Live Feed */}
                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900 lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100">Live Feed (Terbaru)</h3>
                        {newTransactionAnim && (
                            <span className="text-xs bg-safety-amber text-steel-900 px-2 py-1 rounded-full animate-bounce font-display font-bold uppercase">
                                Baru!
                            </span>
                        )}
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {liveFeed.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Belum ada aktivitas real-time.</p>
                        ) : (
                            liveFeed.map((t, i) => (
                                <div key={`${t.id}-${i}`} className={`flex border-l-4 p-3 bg-gray-50 dark:bg-steel-900 rounded-r shadow-sm ${t.status === 'Selesai' ? 'border-signal-green' : 'border-blue-500'}`}>
                                    <div className="flex-1">
                                        <p className="text-sm font-mono font-bold text-gray-900 dark:text-steel-100">{t.truckPlateNumber}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{t.ticketNumber} - <span className="font-sans">{t.customerName}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{t.status === 'Selesai' ? 'Timbang Keluar' : 'Timbang Masuk'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{new Date(t.status === 'Selesai' ? t.weighOutTimestamp : t.weighInTimestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Trucks on Site */}
                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900 lg:col-span-1">
                    <h3 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4">Truk di Lokasi (Menunggu)</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {trucksOnSiteList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <CheckCircle size={32} className="mb-2" />
                                <p className="text-sm font-display">Tidak ada antrean truk.</p>
                            </div>
                        ) : (
                            trucksOnSiteList.map(t => {
                                const diffMs = currentTime.getTime() - new Date(t.weighInTimestamp).getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMins / 60);
                                const mins = diffMins % 60;
                                
                                return (
                                    <div key={t.id} className="border border-gray-200 dark:border-steel-700 bg-gray-50 dark:bg-steel-900 p-3 rounded-lg flex justify-between items-center transition-colors">
                                        <div>
                                            <p className="font-mono font-bold text-sm text-gray-900 dark:text-steel-100">{t.truckPlateNumber}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.materialTypeName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xs font-mono font-bold px-2 py-1 rounded-full ${diffMins > 60 ? 'bg-red-100 dark:bg-alert-red/20 text-red-700 dark:text-alert-red' : 'bg-yellow-100 dark:bg-safety-amber/20 text-yellow-700 dark:text-safety-amber'}`}>
                                                {diffHours > 0 ? `${diffHours}j ` : ''}{mins}m
                                            </p>
                                            <p className="text-[10px] font-mono text-gray-400 mt-1">In: {new Date(t.weighInTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Top Customers Pie Chart */}
                <div className="bg-white dark:bg-steel-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-steel-900 lg:col-span-1">
                    <h3 className="text-lg font-display font-bold text-gray-900 dark:text-steel-100 mb-4">Top 5 Pelanggan (Bulan Ini)</h3>
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
                                        stroke="none"
                                    >
                                        {summary.topCustomersThisMonth.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(value: any) => [`${(value || 0).toLocaleString()} Kg`, 'Volume']} 
                                        contentStyle={{ backgroundColor: '#1C2128', borderColor: '#2D3339', color: '#EDEEF0', borderRadius: '8px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm font-display">
                                Belum ada data bulan ini.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
