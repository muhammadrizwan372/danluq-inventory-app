import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
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
  Zap,
  Brain,
  Bell,
  Sun,
  Moon,
  Activity,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  section?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Analytics', href: '/analytics', icon: Brain, section: 'Intelligence' },
  { name: 'Production Intel', href: '/production-intelligence', icon: Activity },
  { name: 'Mgmt Reports', href: '/management-reports', icon: TrendingUp },
  { name: 'Products', href: '/products', icon: Package, section: 'Operations' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ClipboardList },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Production', href: '/production', icon: Factory },
  { name: 'Electricity', href: '/electricity', icon: Zap },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Chart of Accounts', href: '/accounts', icon: BookOpen, section: 'Finance' },
  { name: 'Journal Entries', href: '/transactions', icon: Receipt },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'AP & AR', href: '/payables-receivables', icon: CreditCard },
  { name: 'Financial Reports', href: '/financial-reports', icon: PieChart },
  { name: 'Employees', href: '/employees', icon: Briefcase, section: 'HR & Payroll' },
  { name: 'Payroll', href: '/payroll', icon: Banknote },
  { name: 'Users', href: '/users', icon: UserCog, adminOnly: true, section: 'Admin' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get('/notifications/unread-count').then((res) => setUnreadCount(res.data.count)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/notifications/unread-count').then((res) => setUnreadCount(res.data.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredNav = navigation.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || user?.role === 'admin'
  );

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-bg-dark' : 'bg-bg'}`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] sidebar-glass border-r transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto ${
          theme === 'dark' ? 'border-border-dark' : 'border-border'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center justify-between h-16 px-5 border-b ${theme === 'dark' ? 'border-border-dark' : 'border-border'}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary'}`}>Danluq Petro</span>
              <p className="text-[10px] text-text-secondary dark:text-text-secondary-dark font-medium tracking-wider uppercase">ERP System</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto h-[calc(100vh-140px)]">
          {(() => {
            let currentSection: string | undefined;
            return filteredNav.map((item, idx) => {
            if (item.section) currentSection = item.section;
            const effectiveSection = currentSection;
            const isActive = location.pathname === item.href;
            const showSection = item.section && (idx === 0 || filteredNav[idx - 1]?.section !== item.section);
            const belongsToCollapsedSection = effectiveSection && collapsedSections[effectiveSection];

            return (
              <div key={item.name}>
                {showSection && (
                  <button
                    onClick={() => toggleSection(item.section!)}
                    className={`flex items-center justify-between w-full px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                      theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary'
                    }`}
                  >
                    {item.section}
                    {collapsedSections[item.section!] ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
                {!belongsToCollapsedSection && (
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                        : theme === 'dark'
                        ? 'text-text-secondary-dark hover:bg-white/5 hover:text-text-primary-dark'
                        : 'text-text-secondary hover:bg-black/5 hover:text-text-primary'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-500' : ''}`} />
                    {item.name}
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </Link>
                )}
              </div>
            );
          });
          })()}
        </nav>

        <div className={`p-3 border-t ${theme === 'dark' ? 'border-border-dark' : 'border-border'}`}>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary'}`}>{user?.full_name}</p>
              <p className="text-[10px] text-text-secondary dark:text-text-secondary-dark truncate capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-text-secondary hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-14 flex items-center justify-between px-4 lg:px-6 border-b glass-card rounded-none ${
          theme === 'dark' ? 'border-border-dark' : 'border-border'
        }`}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className={`text-sm font-semibold ${theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary'}`}>
                {navigation.find((n) => n.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10 text-yellow-400'
                  : 'bg-black/5 hover:bg-black/10 text-gray-600'
              }`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/analytics"
              className={`relative p-2 rounded-xl transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10 text-text-secondary-dark'
                  : 'bg-black/5 hover:bg-black/10 text-text-secondary'
              }`}
              title="Notifications & Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-glow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className={`flex-1 overflow-auto p-4 lg:p-6 ${theme === 'dark' ? 'bg-bg-dark' : 'bg-bg'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
