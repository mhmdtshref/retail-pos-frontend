import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Items from '../pages/Items';
import Sales from '../pages/Sales';
import POS from '../pages/POS';
import { CreatePurchaseOrder } from '../pages/CreatePurchaseOrder';

const PurchaseOrdersList = () => <div style={{padding: 32}}><h2>Purchase Orders List</h2><p>Coming soon...</p></div>;

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="purchase-orders" element={<PurchaseOrdersList />} />
        <Route path="purchase-orders/create" element={<CreatePurchaseOrder />} />
        <Route path="sales" element={<Sales />} />
        <Route path="pos" element={<POS />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 