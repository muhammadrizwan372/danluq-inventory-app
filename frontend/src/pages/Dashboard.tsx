import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { getStatusBadgeClass } from '../components/ui';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Package, ShoppingCart, Users, DollarSign, Clock, AlertTriangle,
  Activity, Brain, ArrowUpRight, ArrowDownRight,
  RefreshCw,
} from 'lucide-react';

interface DashboardData {
  stats: {
    total_products: number; total_orders: number; total_customers: number;
    total_suppliers: number; total_revenue: number; pending_orders: number;
    low_stock_count: number;
  };
  low_stock_products: Array<{ id: number; name: string; sku: string; stock_quantity: number; reorder_level: number }>;
  recent_orders: Array<{ id: number; order_number: string; customer_name: string; total: number; status: string; created_at: string }>;
  top_products: Array<{ id: number; name: string; sku: string; total_sold: number; total_revenue: number }>;
}

interface AnalyticsData {
  recommendations: Array<{ type: string; severity: string; title: string; message: string; action: string | null }>;
  efficiency: { current_month_efficiency: number; previous_month_efficiency: number; efficiency_change: number; daily_efficiency: Array<{ date: string; efficiency: number; total_kg: number }> };
  profit_forecast: { historical: Array<{ month: string; revenue: number; expenses: number; profit: number }>; forecast: Array<{ month: string; predicted_revenue: number; predicted_profit: number }> };
  performance: { current_month: { period: string; revenue: number; orders: number; production_kg: number; expenses: number; profit: number }; previous_month: { period: string; revenue: number; orders: number; production_kg: number; expenses: number; profit: number }; changes: { revenue: number; orders: number; production: number; expenses: number; profit: number } };
  expense_breakdown: { by_category: Array<{ category: string; current_amount: number; change_percent: number }> };
  electricity: { departments: Array<{ name: string; total_units: number; percentage: number; estimated_cost: number }> };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

function KPICard({ title, value, subtitle, icon: Icon, color, change, delay }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType;
  color: string; change?: number; delay: number;
}) {
  const { theme } = useTheme();
  return (
    <div className={`kpi-card kpi-${color} animate-fade-in-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary'}`}>{value}</p>
          {subtitle && <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary'}`}>{subtitle}</p>}
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}% vs last month
            </div>
          )}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg ${
          color === 'blue' ? 'from-blue-500 to-blue-600' :
          color === 'green' ? 'from-emerald-500 to-emerald-600' :
          color === 'purple' ? 'from-purple-500 to-purple-600' :
          color === 'orange' ? 'from-amber-500 to-amber-600' :
          color === 'red' ? 'from-red-500 to-red-600' :
          'from-cyan-500 to-cyan-600'
        }`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { theme } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    Promise.all([
      api.get('/dashboard/').then((r) => r.data),
      api.get('/analytics/dashboard/executive').then((r) => r.data).catch(() => null),
    ]).then(([dash, anal]) => {
      setData(dash);
      setAnalytics(anal);
      setLastRefresh(new Date());
    }).catch(console.error).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-spin flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <p className={`text-sm ${theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary'}`}>Loading intelligence...</p>
      </div>
    </div>
  );
  if (!data) return <p className="text-gray-500">Failed to load dashboard</p>;

  const { stats } = data;
  const changes = analytics?.performance?.changes;

  const profitChartData = [
    ...(analytics?.profit_forecast?.historical || []).map((h) => ({
      month: h.month, Revenue: h.revenue, Expenses: h.expenses, Profit: h.profit, type: 'actual',
    })),
    ...(analytics?.profit_forecast?.forecast || []).map((f) => ({
      month: f.month, Revenue: f.predicted_revenue, Expenses: 0, Profit: f.predicted_profit, type: 'forecast',
    })),
  ];

  const efficiencyData = analytics?.efficiency?.daily_efficiency || [];

  const expenseData = (analytics?.expense_breakdown?.by_category || []).slice(0, 6).map((e, i) => ({
    name: e.category.charAt(0).toUpperCase() + e.category.slice(1),
    value: e.current_amount,
    fill: COLORS[i % COLORS.length],
  }));

  const elecData = (analytics?.electricity?.departments || []).map((d, i) => ({
    name: d.name, units: d.total_units, cost: d.estimated_cost, fill: COLORS[i % COLORS.length],
  }));

  const textPrimary = theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary';
  const textSecondary = theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Executive Dashboard</h1>
          <p className={`text-sm ${textSecondary}`}>AI-powered business intelligence overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] ${textSecondary}`}>
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            title="Refresh now"
          >
            <RefreshCw className={`h-4 w-4 ${textSecondary} ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <KPICard title="Revenue" value={`Rs.${stats.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} color="green" change={changes?.revenue} delay={0} />
        <KPICard title="Orders" value={stats.total_orders} icon={ShoppingCart} color="blue" change={changes?.orders} delay={50} />
        <KPICard title="Products" value={stats.total_products} icon={Package} color="purple" delay={100} />
        <KPICard title="Customers" value={stats.total_customers} icon={Users} color="cyan" delay={150} />
        <KPICard title="Pending" value={stats.pending_orders} icon={Clock} color="orange" delay={200} />
        <KPICard title="Low Stock" value={stats.low_stock_count} icon={AlertTriangle} color="red" delay={250} />
        <KPICard title="Efficiency" value={`${analytics?.efficiency?.current_month_efficiency ?? 0}%`} icon={Activity} color="blue" change={analytics?.efficiency?.efficiency_change} delay={300} />
      </div>

      {/* AI Recommendations */}
      {analytics?.recommendations && analytics.recommendations.length > 0 && (
        <div className={`glass-card rounded-2xl p-5 animate-fade-in-up`} style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-purple-500" />
            <h2 className={`text-lg font-semibold ${textPrimary}`}>AI Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {analytics.recommendations.slice(0, 6).map((rec, i) => (
              <div key={i} className={`severity-${rec.severity} rounded-xl p-3.5 animate-slide-in-right`} style={{ animationDelay: `${300 + i * 80}ms` }}>
                <h3 className={`text-sm font-semibold ${textPrimary}`}>{rec.title}</h3>
                <p className={`text-xs mt-1 ${textSecondary}`}>{rec.message}</p>
                {rec.action && (
                  <span className="inline-block mt-2 text-[11px] font-medium text-blue-600 dark:text-blue-400">{rec.action}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue & Profit Chart */}
        <div className={`glass-card rounded-2xl p-5 animate-fade-in-up`} style={{ animationDelay: '300ms' }}>
          <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Revenue & Profit Forecast</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={profitChartData}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#313244' : '#e5e7eb'} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme === 'dark' ? '#a6adc8' : '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: theme === 'dark' ? '#a6adc8' : '#6b7280' }} />
              <Tooltip contentStyle={{ background: theme === 'dark' ? '#1e1e2e' : '#fff', border: 'none', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }} />
              <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#gradRevenue)" strokeWidth={2} />
              <Area type="monotone" dataKey="Profit" stroke="#10b981" fillOpacity={1} fill="url(#gradProfit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Production Efficiency */}
        <div className={`glass-card rounded-2xl p-5 animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-base font-semibold ${textPrimary}`}>Production Efficiency Trend</h2>
            <span className={`text-xs ${textSecondary}`}>Last 30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={efficiencyData}>
              <defs>
                <linearGradient id="gradEff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#313244' : '#e5e7eb'} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme === 'dark' ? '#a6adc8' : '#6b7280' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: theme === 'dark' ? '#a6adc8' : '#6b7280' }} />
              <Tooltip contentStyle={{ background: theme === 'dark' ? '#1e1e2e' : '#fff', border: 'none', borderRadius: 12 }} />
              <Area type="monotone" dataKey="efficiency" stroke="#8b5cf6" fillOpacity={1} fill="url(#gradEff)" strokeWidth={2} name="Efficiency %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Expense Breakdown */}
        <div className={`glass-card rounded-2xl p-5 animate-fade-in-up`} style={{ animationDelay: '400ms' }}>
          <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Expense Breakdown</h2>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `Rs.${Number(v).toLocaleString()}`} contentStyle={{ background: theme === 'dark' ? '#1e1e2e' : '#fff', border: 'none', borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className={`text-sm ${textSecondary} text-center py-10`}>No expense data</p>}
        </div>

        {/* Electricity by Department */}
        <div className={`glass-card rounded-2xl p-5 animate-fade-in-up`} style={{ animationDelay: '450ms' }}>
          <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Energy by Department</h2>
          {elecData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={elecData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#313244' : '#e5e7eb'} />
                <XAxis type="number" tick={{ fontSize: 11, fill: theme === 'dark' ? '#a6adc8' : '#6b7280' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: theme === 'dark' ? '#a6adc8' : '#6b7280' }} width={80} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#1e1e2e' : '#fff', border: 'none', borderRadius: 12 }} />
                <Bar dataKey="units" fill="#06b6d4" radius={[0, 6, 6, 0]} name="Units (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className={`text-sm ${textSecondary} text-center py-10`}>No electricity data</p>}
        </div>

        {/* Performance Comparison */}
        <div className={`glass-card rounded-2xl p-5 animate-fade-in-up`} style={{ animationDelay: '500ms' }}>
          <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>Monthly Comparison</h2>
          {analytics?.performance ? (
            <div className="space-y-3">
              {[
                { label: 'Revenue', current: analytics.performance.current_month.revenue, change: analytics.performance.changes.revenue },
                { label: 'Orders', current: analytics.performance.current_month.orders, change: analytics.performance.changes.orders },
                { label: 'Production', current: analytics.performance.current_month.production_kg, change: analytics.performance.changes.production, suffix: 'kg' },
                { label: 'Expenses', current: analytics.performance.current_month.expenses, change: analytics.performance.changes.expenses },
                { label: 'Profit', current: analytics.performance.current_month.profit, change: analytics.performance.changes.profit },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`text-xs ${textSecondary}`}>{item.label}</p>
                    <p className={`text-sm font-semibold ${textPrimary}`}>
                      {item.label === 'Orders' || item.label === 'Production'
                        ? `${item.current.toLocaleString()}${item.suffix || ''}`
                        : `Rs.${item.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${item.change > 0 ? 'text-green-500' : item.change < 0 ? 'text-red-500' : textSecondary}`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
              ))}
            </div>
          ) : <p className={`text-sm ${textSecondary} text-center py-10`}>No comparison data</p>}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className={`glass-card rounded-2xl overflow-hidden animate-fade-in-up`} style={{ animationDelay: '550ms' }}>
          <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-200'}`}>
            <h2 className={`text-base font-semibold ${textPrimary}`}>Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-4 py-3 font-medium text-xs uppercase tracking-wider ${textSecondary}`}>Order</th>
                  <th className={`px-4 py-3 font-medium text-xs uppercase tracking-wider ${textSecondary}`}>Customer</th>
                  <th className={`px-4 py-3 font-medium text-xs uppercase tracking-wider ${textSecondary}`}>Total</th>
                  <th className={`px-4 py-3 font-medium text-xs uppercase tracking-wider ${textSecondary}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.length === 0 ? (
                  <tr><td colSpan={4} className={`text-center py-8 ${textSecondary}`}>No orders yet</td></tr>
                ) : data.recent_orders.map((order) => (
                  <tr key={order.id} className={`hover:${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} transition-colors`}>
                    <td className={`px-4 py-3 border-b font-medium ${theme === 'dark' ? 'border-border-dark' : 'border-gray-100'} ${textPrimary}`}>{order.order_number}</td>
                    <td className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-100'} ${textSecondary}`}>{order.customer_name}</td>
                    <td className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-100'} ${textPrimary}`}>Rs.{order.total.toFixed(2)}</td>
                    <td className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-100'}`}>
                      <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock / Top Products */}
        <div className={`glass-card rounded-2xl overflow-hidden animate-fade-in-up`} style={{ animationDelay: '600ms' }}>
          <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-200'}`}>
            <h2 className={`text-base font-semibold ${textPrimary}`}>Inventory Alerts</h2>
          </div>
          <div className="p-4 space-y-2">
            {data.low_stock_products.length === 0 ? (
              <p className={`text-sm text-center py-6 ${textSecondary}`}>All stock levels healthy</p>
            ) : data.low_stock_products.map((p) => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${
                p.stock_quantity === 0 ? 'severity-critical' : 'severity-high'
              }`}>
                <div>
                  <p className={`text-sm font-medium ${textPrimary}`}>{p.name}</p>
                  <p className={`text-xs ${textSecondary}`}>SKU: {p.sku}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${p.stock_quantity === 0 ? 'text-red-500' : 'text-orange-500'}`}>{p.stock_quantity}</p>
                  <p className={`text-[10px] ${textSecondary}`}>Reorder: {p.reorder_level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
