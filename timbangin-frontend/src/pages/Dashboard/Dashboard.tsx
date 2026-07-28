import React from 'react';

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Customer</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">124</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Truck</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">56</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Transaksi Hari Ini</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
        <p>Dashboard content placeholder</p>
      </div>
    </div>
  );
};
