import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { DashboardLayout } from './components/Layouts/DashboardLayout';
import { ProtectedRoute } from './components/Routes/ProtectedRoute';
import { Customers } from './pages/MasterData/Customers';
import { Trucks } from './pages/MasterData/Trucks';
import { MaterialTypes } from './pages/MasterData/MaterialTypes';
import { WeighbridgeMonitor } from './pages/WeighbridgeMonitor/WeighbridgeMonitor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/trucks" element={<Trucks />} />
            <Route path="/master/material-types" element={<MaterialTypes />} />
          
            {/* Real-time Display */}
            <Route path="/weighbridge-monitor" element={<WeighbridgeMonitor />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
