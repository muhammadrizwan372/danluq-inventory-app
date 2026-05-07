import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  ClipboardList,
  FileText,
  BarChart3,
  UserCog,
  LogOut,
  Menu,
  X,
  BookOpen,
  Receipt,
  Wallet,
  CreditCard,
  PieChart,
  Briefcase,
  Banknote,
  Factory,
} from 'lucide-react';

interface NavItem { name: string; href: string; icon: any; adminOnly?: boolean; section?: string; }

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package, section: 'Inventory' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ClipboardList },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Production', href: '/production', icon: Factory },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Chart of Accounts', href: '/accounts', icon: BookOpen, section: 'Accounting' },
  { name: 'Journal Entries', href: '/transactions', icon: Receipt },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'Payables & Receivables', href: '/payables-receivables', icon: CreditCard },
  { name: 'Financial Reports', href: '/financial-reports', icon: PieChart },
  { name: 'Employees', href: '/employees', icon: Briefcase, section: 'HR & Payroll' },
  { name: 'Payroll', href: '/payroll', icon: Banknote },
  { name: 'Users', href: '/users', icon: UserCog, adminOnly: true, section: 'Admin' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navigation.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || user?.role === 'admin'
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">Danluq Petro</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item, idx) => {
            const isActive = location.pathname === item.href;
            const showSection = item.section && (idx === 0 || filteredNav[idx - 1]?.section !== item.section);
            return (
              <div key={item.name}>
                {showSection && (
                  <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.section}</p>
                )}
                <Link
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-gray-600" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:inline">Welcome, {user?.full_name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
