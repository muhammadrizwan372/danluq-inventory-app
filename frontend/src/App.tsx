import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Expenses from './pages/Expenses';
import PayablesReceivables from './pages/PayablesReceivables';
import FinancialReports from './pages/FinancialReports';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Production from './pages/Production';
import Electricity from './pages/Electricity';
import Analytics from './pages/Analytics';
import ProductionIntelligence from './pages/ProductionIntelligence';
import ManagementReports from './pages/ManagementReports';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-spin" />
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Loading...</p>
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg dark:bg-bg-dark">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-spin" />
      </div>
    );
  }
  return user ? <Navigate to="/" /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/payables-receivables" element={<PayablesReceivables />} />
              <Route path="/financial-reports" element={<FinancialReports />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/production" element={<Production />} />
              <Route path="/electricity" element={<Electricity />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/production-intelligence" element={<ProductionIntelligence />} />
              <Route path="/management-reports" element={<ManagementReports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
