import { useEffect, useState } from 'react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Calendar, TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, ArrowUpRight, ArrowDownRight, RefreshCw,
  Lightbulb, Factory,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function ManagementReports() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/reports/${period}`)
      .then((r) => setReport(r.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [period]);

  const textP = theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary';
  const textS = theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary';
  const cardBg = theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-200';
  const gridStroke = theme === 'dark' ? '#313244' : '#e5e7eb';
  const tickFill = theme === 'dark' ? '#a6adc8' : '#6b7280';
  const tooltipBg = theme === 'dark' ? '#1e1e2e' : '#fff';

  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value > 0) return <span className="flex items-center gap-0.5 text-green-500 text-xs font-medium"><ArrowUpRight className="h-3 w-3" />+{value}%</span>;
    if (value < 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><ArrowDownRight className="h-3 w-3" />{value}%</span>;
    return <span className={`text-xs ${textS}`}>0%</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className={`text-sm ${textS}`}>Generating {period} report...</p>
      </div>
    </div>
  );

  const current = report?.current || {};
  const changes = report?.changes || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textP}`}>Management Intelligence</h1>
          <p className={`text-sm ${textS}`}>
            {period === 'daily' ? "Today's" : period === 'weekly' ? 'This Week' : 'This Month'} performance summary
            {report?.date_range && <span className="ml-2 opacity-60">({report.date_range.start} to {report.date_range.end})</span>}
          </p>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1.5">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              period === p
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : theme === 'dark' ? 'bg-white/5 text-text-secondary-dark hover:bg-white/10' : 'bg-white text-text-secondary hover:bg-gray-100'
            }`}
          >
            <Calendar className="h-4 w-4" />
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="kpi-card kpi-green animate-fade-in-up">
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textS}`}>Revenue</p>
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <p className={`text-xl font-bold ${textP}`}>Rs.{(current.revenue || 0).toLocaleString()}</p>
          <ChangeIndicator value={changes.revenue || 0} />
        </div>
        <div className="kpi-card kpi-blue animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textS}`}>Orders</p>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </div>
          <p className={`text-xl font-bold ${textP}`}>{current.orders || 0}</p>
          <ChangeIndicator value={changes.orders || 0} />
        </div>
        <div className="kpi-card kpi-purple animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textS}`}>Production</p>
            <Factory className="h-4 w-4 text-purple-500" />
          </div>
          <p className={`text-xl font-bold ${textP}`}>{(current.production_kg || 0).toLocaleString()} kg</p>
          <ChangeIndicator value={changes.production_kg || 0} />
        </div>
        <div className="kpi-card kpi-orange animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textS}`}>Expenses</p>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </div>
          <p className={`text-xl font-bold ${textP}`}>Rs.{(current.expenses || 0).toLocaleString()}</p>
          <ChangeIndicator value={changes.expenses || 0} />
        </div>
        <div className={`kpi-card ${(current.profit || 0) >= 0 ? 'kpi-green' : 'kpi-red'} animate-fade-in-up stagger-4`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textS}`}>Net Profit</p>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className={`text-xl font-bold ${(current.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            Rs.{(current.profit || 0).toLocaleString()}
          </p>
          <ChangeIndicator value={changes.profit || 0} />
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <p className={`text-xs ${textS}`}>Efficiency</p>
          <p className={`text-2xl font-bold ${textP}`}>{current.efficiency || 0}%</p>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mt-2">
            <div className={`h-full rounded-full ${(current.efficiency || 0) >= 90 ? 'bg-green-500' : (current.efficiency || 0) >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(current.efficiency || 0, 100)}%` }} />
          </div>
        </div>
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <p className={`text-xs ${textS}`}>Waste</p>
          <p className={`text-2xl font-bold ${textP}`}>{(current.waste_kg || 0).toLocaleString()} kg</p>
          <ChangeIndicator value={changes.waste_kg || 0} />
        </div>
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <p className={`text-xs ${textS}`}>Electricity Cost</p>
          <p className={`text-2xl font-bold ${textP}`}>Rs.{(current.electricity_cost || 0).toLocaleString()}</p>
          <ChangeIndicator value={changes.electricity_cost || 0} />
        </div>
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <p className={`text-xs ${textS}`}>Electricity Units</p>
          <p className={`text-2xl font-bold ${textP}`}>{(current.electricity_units || 0).toLocaleString()}</p>
          <ChangeIndicator value={changes.electricity_units || 0} />
        </div>
      </div>

      {/* AI Insights */}
      {report?.insights && report.insights.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className={`text-lg font-semibold ${textP}`}>AI Insights</h2>
          </div>
          <div className="space-y-2">
            {report.insights.map((insight: string, i: number) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-xl ${
                theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
              }`}>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p className={`text-sm ${textP}`}>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Products */}
        {report?.top_products && report.top_products.length > 0 && (
          <div className={`rounded-2xl border p-5 ${cardBg}`}>
            <h2 className={`text-base font-semibold mb-4 ${textP}`}>Top Products by Production</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={report.top_products}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 11 }} />
                <YAxis tick={{ fill: tickFill, fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: gridStroke, borderRadius: 12 }} />
                <Bar dataKey="total_kg" name="Production (kg)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Expense Categories */}
        {report?.top_expenses && report.top_expenses.length > 0 && (
          <div className={`rounded-2xl border p-5 ${cardBg}`}>
            <h2 className={`text-base font-semibold mb-4 ${textP}`}>Top Expense Categories</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={report.top_expenses} dataKey="total" nameKey="category" cx="50%" cy="50%"
                  outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {report.top_expenses.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: gridStroke, borderRadius: 12 }}
                  formatter={(value) => `Rs.${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {report.top_expenses.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className={`text-xs ${textS}`}>{e.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className={`rounded-2xl border p-5 ${cardBg}`}>
        <h2 className={`text-base font-semibold mb-4 ${textP}`}>Current vs Previous Period</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-200'}`}>
                <th className={`text-left py-2 px-3 font-medium ${textS}`}>Metric</th>
                <th className={`text-right py-2 px-3 font-medium ${textS}`}>Current</th>
                <th className={`text-right py-2 px-3 font-medium ${textS}`}>Previous</th>
                <th className={`text-right py-2 px-3 font-medium ${textS}`}>Change</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Revenue', key: 'revenue', fmt: (v: number) => `Rs.${v.toLocaleString()}` },
                { label: 'Orders', key: 'orders', fmt: (v: number) => v.toString() },
                { label: 'Production', key: 'production_kg', fmt: (v: number) => `${v.toLocaleString()} kg` },
                { label: 'Waste', key: 'waste_kg', fmt: (v: number) => `${v.toLocaleString()} kg` },
                { label: 'Efficiency', key: 'efficiency', fmt: (v: number) => `${v}%` },
                { label: 'Expenses', key: 'expenses', fmt: (v: number) => `Rs.${v.toLocaleString()}` },
                { label: 'Electricity', key: 'electricity_cost', fmt: (v: number) => `Rs.${v.toLocaleString()}` },
                { label: 'Net Profit', key: 'profit', fmt: (v: number) => `Rs.${v.toLocaleString()}` },
              ].map((row) => (
                <tr key={row.key} className={`border-b ${theme === 'dark' ? 'border-border-dark/50' : 'border-gray-100'}`}>
                  <td className={`py-2.5 px-3 font-medium ${textP}`}>{row.label}</td>
                  <td className={`py-2.5 px-3 text-right ${textP}`}>{row.fmt(current[row.key] || 0)}</td>
                  <td className={`py-2.5 px-3 text-right ${textS}`}>{row.fmt(report?.previous?.[row.key] || 0)}</td>
                  <td className="py-2.5 px-3 text-right"><ChangeIndicator value={changes[row.key] || 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
