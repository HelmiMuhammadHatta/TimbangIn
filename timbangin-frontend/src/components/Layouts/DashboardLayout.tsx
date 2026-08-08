import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Home, Truck, Users, FileText, Box, Scale, Camera, ArrowRightCircle, ArrowLeftCircle, History, Sun, Moon, Menu, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import PermissionGate from '../Guard/PermissionGate';
import { useTheme } from '../../store/ThemeContext';

export const DashboardLayout = () => {
  const { username, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/trucks', icon: Truck, label: 'Master Truck', permission: 'truck.read' },
    { path: '/customers', icon: Users, label: 'Master Customer', permission: 'customer.read' },
    { path: '/material-types', icon: Box, label: 'Master Material', permission: 'material.read' },
    { path: '/weighbridge-monitor', icon: Scale, label: 'Weighbridge Monitor', permission: 'transaction.read' },
    { path: '/gate-monitor', icon: Camera, label: 'Gate Monitor (ANPR)', permission: 'transaction.read' },
    { path: '/weigh-in', icon: ArrowRightCircle, label: 'Timbang Masuk', permission: 'transaction.create' },
    { path: '/weigh-out', icon: ArrowLeftCircle, label: 'Timbang Keluar', permission: 'transaction.create' },
    { path: '/transactions', icon: History, label: 'Riwayat Transaksi', permission: 'transaction.read' },
    { path: '/reports', icon: FileText, label: 'Laporan', permission: 'transaction.read' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-steel-900 transition-colors">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-steel-800 border-r border-gray-200 dark:border-steel-900 flex flex-col shadow-sm transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-steel-900">
          <div className="font-display font-bold text-xl text-safety-amber tracking-wider uppercase">
            TimbangIn
          </div>
          <button className="md:hidden text-gray-500 dark:text-steel-100" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const LinkComponent = (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 p-2.5 rounded-md transition-colors ${
                  isActive 
                    ? 'border-l-4 border-safety-amber bg-gray-100 dark:bg-steel-900 text-safety-amber dark:text-safety-amber font-medium' 
                    : 'border-l-4 border-transparent text-gray-600 dark:text-steel-100 hover:bg-gray-50 dark:hover:bg-steel-900 hover:text-safety-amber'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-safety-amber' : 'opacity-70'} />
                <span>{item.label}</span>
              </Link>
            );

            return item.permission ? (
              <PermissionGate key={item.path} permission={item.permission}>
                {LinkComponent}
              </PermissionGate>
            ) : (
              LinkComponent
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-white dark:bg-steel-800 border-b border-gray-200 dark:border-steel-900 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-500 dark:text-steel-100" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-display font-semibold text-gray-800 dark:text-steel-100 hidden sm:block">Weighbridge Management System</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 text-gray-500 dark:text-steel-100 hover:bg-gray-100 dark:hover:bg-steel-900 rounded-full transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <span className="text-gray-600 dark:text-steel-100 hidden sm:inline-block">
              Halo, <strong className="text-gray-900 dark:text-white font-mono">{username}</strong>
            </span>
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 text-alert-red hover:text-alert-red px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-alert-red/10 transition-colors border border-transparent hover:border-alert-red/30"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline-block font-display tracking-wide text-sm">LOGOUT</span>
            </button>
          </div>
        </header>
        
        <div className="p-4 sm:p-6 overflow-auto h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
