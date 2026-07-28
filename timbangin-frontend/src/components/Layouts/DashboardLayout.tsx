import React from 'react';
import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Home, Truck, Users, Activity, FileText, Box, Scale, Camera } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import PermissionGate from '../Guard/PermissionGate';

export const DashboardLayout = () => {
  const { username, clearAuth } = useAuthStore();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="h-16 flex items-center justify-center border-b font-bold text-xl text-blue-600">
          TimbangIn
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md text-gray-700">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <PermissionGate permission="truck.read">
            <Link to="/trucks" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md text-gray-700">
              <Truck size={20} />
              <span>Master Truck</span>
            </Link>
          </PermissionGate>
          <PermissionGate permission="customer.read">
            <Link to="/customers" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md text-gray-700">
              <Users size={20} />
              <span>Master Customer</span>
            </Link>
          </PermissionGate>
          <PermissionGate permission="material.read">
            <Link to="/material-types" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md text-gray-700">
              <Box size={20} />
              <span>Master Material</span>
            </Link>
          </PermissionGate>
          <PermissionGate permission="transaction.read">
            <Link to="/weighbridge-monitor" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md text-gray-700">
              <Scale size={20} />
              <span>Weighbridge Monitor</span>
            </Link>
          </PermissionGate>
          <PermissionGate permission="transaction.read">
            <Link to="/gate-monitor" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md text-gray-700">
              <Camera size={20} />
              <span>Gate Monitor (ANPR)</span>
            </Link>
          </PermissionGate>
          <PermissionGate permission="transaction.read">
            <Link to="/" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md text-gray-700">
              <Activity size={20} />
              <span>Transaksi Timbang</span>
            </Link>
          </PermissionGate>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Weighbridge Management System</h2>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Halo, <strong className="text-gray-900">{username}</strong></span>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>
        
        <div className="p-6 overflow-auto h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
