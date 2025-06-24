import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { clerkConfig } from './config/clerk';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Sales from './pages/Sales';
import POS from './pages/POS';
import { CreatePurchaseOrder } from './pages/CreatePurchaseOrder';
import { PurchaseOrders } from './pages/PurchaseOrders';

const ClerkProviderWithRoutes = () => {
  const navigate = useNavigate();
  
  return (
    <ClerkProvider
      {...clerkConfig}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="items" element={<Items />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="purchase-orders/create" element={<CreatePurchaseOrder />} />
          <Route path="sales" element={<Sales />} />
          <Route path="pos" element={<POS />} />
        </Route>
      </Routes>
    </ClerkProvider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ClerkProviderWithRoutes />
    </Router>
  );
};

export default App; 