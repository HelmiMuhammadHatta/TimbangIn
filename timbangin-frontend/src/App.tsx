import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { DashboardLayout } from './components/Layouts/DashboardLayout';
import { ProtectedRoute } from './components/Routes/ProtectedRoute';
import { Customers } from './pages/MasterData/Customers';
import { Trucks } from './pages/MasterData/Trucks';
import { MaterialTypes } from './pages/MasterData/MaterialTypes';
import { Reports } from './pages/Reports/Reports';
import { WeighbridgeMonitor } from './pages/WeighbridgeMonitor/WeighbridgeMonitor';
import GateMonitor from './pages/GateMonitor/GateMonitor';
import { WeighIn } from './pages/Transactions/WeighIn';
import { WeighOut } from './pages/Transactions/WeighOut';
import { TransactionHistory } from './pages/Transactions/TransactionHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/master/customers" element={<Customers />} />
            <Route path="/master/trucks" element={<Trucks />} />
            <Route path="/master/materials" element={<MaterialTypes />} />
            <Route path="reports" element={<Reports />} />
          
            {/* Real-time Display */}
            <Route path="/weighbridge-monitor" element={<WeighbridgeMonitor />} />
            <Route path="/gate-monitor" element={<GateMonitor />} />

            {/* Transactions */}
            <Route path="/weigh-in" element={<WeighIn />} />
            <Route path="/weigh-out" element={<WeighOut />} />
            <Route path="/transactions" element={<TransactionHistory />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
