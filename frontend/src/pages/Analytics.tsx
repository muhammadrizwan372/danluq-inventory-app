import { useEffect, useState } from 'react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Brain, Zap, Package, DollarSign,
  AlertTriangle, Activity, RefreshCw,
  Shield,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'financial' | 'inventory' | 'energy'>('overview');
  const [prodForecast, setProdForecast] = useState<any>(null);
  const [elecForecast, setElecForecast] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [profitForecast, setProfitForecast] = useState<any>(null);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [expenseAnalytics, setExpenseAnalytics] = useState<any>(null);
  const [elecDepts, setElecDepts] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [costPerProduct, setCostPerProduct] = useState<any>(null);
  const [peakLoad, setPeakLoad] = useState<any>(null);
  const [employeeEff, setEmployeeEff] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/predict/production').then((r) => r.data).catch(() => null),
      api.get('/analytics/predict/electricity').then((r) => r.data).catch(() => null),
      api.get('/analytics/predict/inventory').then((r) => r.data).catch(() => null),
      api.get('/analytics/predict/profit').then((r) => r.data).catch(() => null),
      api.get('/analytics/production/efficiency').then((r) => r.data).catch(() => null),
      api.get('/analytics/recommendations').then((r) => r.data).catch(() => []),
      api.get('/analytics/expenses').then((r) => r.data).catch(() => null),
      api.get('/analytics/electricity/departments').then((r) => r.data).catch(() => null),
      api.get('/analytics/performance/comparison').then((r) => r.data).catch(() => null),
      api.get('/analytics/cost-per-product').then((r) => r.data).catch(() => null),
      api.get('/analytics/electricity/peak-load').then((r) => r.data).catch(() => null),
      api.get('/analytics/employees/efficiency').then((r) => r.data).catch(() => null),
    ]).then(([prod, elec, inv, profit, eff, recs, exp, eDepts, perf, cpp, pl, empEff]) => {
      setProdForecast(prod);
      setElecForecast(elec);
      setInventory(inv);
      setProfitForecast(profit);
      setEfficiency(eff);
      setRecommendations(recs || []);
      setExpenseAnalytics(exp);
      setElecDepts(eDepts);
      setPerformance(perf);
      setCostPerProduct(cpp);
      setPeakLoad(pl);
      setEmployeeEff(empEff);
    }).finally(() => setLoading(false));
  }, []);

  const textP = theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary';
  const textS = theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary';
  const gridStroke = theme === 'dark' ? '#313244' : '#e5e7eb';
  const tickFill = theme === 'dark' ? '#a6adc8' : '#6b7280';
  const tooltipBg = theme === 'dark' ? '#1e1e2e' : '#fff';

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Brain },
    { id: 'production' as const, label: 'Production', icon: Activity },
    { id: 'financial' as const, label: 'Financial', icon: DollarSign },
    { id: 'inventory' as const, label: 'Inventory', icon: Package },
    { id: 'energy' as const, label: 'Energy', icon: Zap },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className={`text-sm ${textS}`}>Analyzing business data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textP}`}>AI Business Analytics</h1>
          <p className={`text-sm ${textS}`}>Predictive intelligence & trend analysis</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : theme === 'dark' ? 'bg-white/5 text-text-secondary-dark hover:bg-white/10' : 'bg-white text-text-secondary hover:bg-gray-100'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Recommendations - Always visible */}
      {recommendations.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-purple-500" />
            <h2 className={`text-lg font-semibold ${textP}`}>AI Insights & Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {recommendations.map((rec, i) => (
              <div key={i} className={`severity-${rec.severity} rounded-xl p-4 animate-slide-in-right`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    rec.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                    rec.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    rec.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {rec.type === 'inventory' ? <Package className="h-4 w-4" /> :
                     rec.type === 'production' ? <Activity className="h-4 w-4" /> :
                     rec.type === 'electricity' ? <Zap className="h-4 w-4" /> :
                     rec.type === 'financial' ? <DollarSign className="h-4 w-4" /> :
                     <Shield className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${textP}`}>{rec.title}</h3>
                    <p className={`text-xs mt-1 ${textS}`}>{rec.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          {/* Production Forecast */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-semibold ${textP}`}>Production Forecast</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                prodForecast?.trend === 'increasing' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                prodForecast?.trend === 'decreasing' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>{prodForecast?.trend || 'N/A'}</span>
            </div>
            {prodForecast?.historical && prodForecast.historical.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[
                  ...prodForecast.historical.map((h: any) => ({ date: h.date, actual: h.actual_kg })),
                  ...prodForecast.forecast.slice(0, 14).map((f: any) => ({ date: f.date, forecast: f.predicted_kg })),
                ]}>
                  <defs>
                    <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="url(#gActual)" strokeWidth={2} name="Actual (kg)" />
                  <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" fill="url(#gForecast)" strokeWidth={2} strokeDasharray="5 5" name="Forecast (kg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className={`text-sm text-center py-16 ${textS}`}>Insufficient production data for forecasting</p>}
            {prodForecast && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${textS}`}>Daily Avg</p>
                  <p className={`text-sm font-bold ${textP}`}>{prodForecast.current_daily_avg} kg</p>
                </div>
                <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${textS}`}>Confidence</p>
                  <p className={`text-sm font-bold ${textP}`}>{prodForecast.confidence}%</p>
                </div>
                <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${textS}`}>Data Points</p>
                  <p className={`text-sm font-bold ${textP}`}>{prodForecast.total_data_points}</p>
                </div>
              </div>
            )}
          </div>

          {/* Electricity Forecast */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-semibold ${textP}`}>Electricity Cost Forecast</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                elecForecast?.trend === 'increasing' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                elecForecast?.trend === 'decreasing' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>{elecForecast?.trend || 'N/A'}</span>
            </div>
            {elecForecast?.historical && elecForecast.historical.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[
                  ...elecForecast.historical.map((h: any) => ({ date: h.date, cost: h.cost, units: h.units })),
                  ...elecForecast.forecast.slice(0, 14).map((f: any) => ({ date: f.date, predicted_cost: f.predicted_cost })),
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={false} name="Actual Cost" />
                  <Line type="monotone" dataKey="predicted_cost" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Predicted Cost" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className={`text-sm text-center py-16 ${textS}`}>Insufficient electricity data for forecasting</p>}
            {elecForecast && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${textS}`}>Daily Avg Cost</p>
                  <p className={`text-sm font-bold ${textP}`}>Rs.{elecForecast.current_daily_avg_cost?.toLocaleString()}</p>
                </div>
                <div className={`text-center p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${textS}`}>Daily Avg Units</p>
                  <p className={`text-sm font-bold ${textP}`}>{elecForecast.current_daily_avg_units} kWh</p>
                </div>
              </div>
            )}
          </div>

          {/* Profit Forecast */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className={`text-base font-semibold mb-4 ${textP}`}>Profit & Revenue Forecast</h2>
            {profitForecast?.historical && profitForecast.historical.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  ...profitForecast.historical.map((h: any) => ({ ...h, type: 'actual' })),
                  ...profitForecast.forecast.map((f: any) => ({ month: f.month, revenue: f.predicted_revenue, profit: f.predicted_profit, type: 'forecast' })),
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickFill }} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className={`text-sm text-center py-16 ${textS}`}>Insufficient financial data</p>}
          </div>

          {/* Expense Analytics */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className={`text-base font-semibold mb-4 ${textP}`}>Smart Expense Analysis</h2>
            {expenseAnalytics?.by_category && expenseAnalytics.by_category.length > 0 ? (
              <div className="space-y-2.5">
                {expenseAnalytics.by_category.map((cat: any, i: number) => (
                  <div key={cat.category} className={`flex items-center gap-3 p-2.5 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${textP}`}>{cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}</p>
                        <p className={`text-sm font-bold ${textP}`}>Rs.{cat.current_amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mr-3">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, (cat.current_amount / (expenseAnalytics.total_current_expenses || 1)) * 100)}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }} />
                        </div>
                        <span className={`text-xs font-medium ${cat.change_percent > 10 ? 'text-red-500' : cat.change_percent < -10 ? 'text-green-500' : textS}`}>
                          {cat.change_percent > 0 ? '+' : ''}{cat.change_percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {expenseAnalytics.profit_leaks?.length > 0 && (
                  <div className="severity-high rounded-xl p-3 mt-3">
                    <p className={`text-xs font-semibold ${textP}`}>
                      <AlertTriangle className="inline h-3 w-3 mr-1" />
                      Profit Leaks Detected: {expenseAnalytics.profit_leaks.map((l: any) => l.category).join(', ')} showing &gt;15% increase
                    </p>
                  </div>
                )}
              </div>
            ) : <p className={`text-sm text-center py-16 ${textS}`}>No expense data</p>}
          </div>
        </div>
      )}

      {/* Production Tab */}
      {activeTab === 'production' && (
        <div className="space-y-5 animate-fade-in">
          {/* Efficiency Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="kpi-card kpi-blue">
              <p className={`text-xs ${textS}`}>Current Efficiency</p>
              <p className={`text-2xl font-bold ${textP}`}>{efficiency?.current_month_efficiency || 0}%</p>
            </div>
            <div className="kpi-card kpi-purple">
              <p className={`text-xs ${textS}`}>Previous Month</p>
              <p className={`text-2xl font-bold ${textP}`}>{efficiency?.previous_month_efficiency || 0}%</p>
            </div>
            <div className="kpi-card kpi-green">
              <p className={`text-xs ${textS}`}>Weekly Efficiency</p>
              <p className={`text-2xl font-bold ${textP}`}>{efficiency?.weekly_efficiency || 0}%</p>
            </div>
            <div className={`kpi-card ${(efficiency?.efficiency_change || 0) >= 0 ? 'kpi-green' : 'kpi-red'}`}>
              <p className={`text-xs ${textS}`}>Change</p>
              <p className={`text-2xl font-bold ${(efficiency?.efficiency_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(efficiency?.efficiency_change || 0) > 0 ? '+' : ''}{efficiency?.efficiency_change || 0}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily Efficiency Chart */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Daily Efficiency Trend</h2>
              {efficiency?.daily_efficiency?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={efficiency.daily_efficiency}>
                    <defs><linearGradient id="gEff2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickFill }} />
                    <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="efficiency" stroke="#8b5cf6" fill="url(#gEff2)" strokeWidth={2} name="Efficiency %" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className={`text-sm text-center py-16 ${textS}`}>No production data</p>}
            </div>

            {/* Shift Comparison */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Shift-wise Efficiency</h2>
              {efficiency?.shift_efficiency && Object.keys(efficiency.shift_efficiency).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(efficiency.shift_efficiency).map(([shift, data]: [string, any]) => (
                    <div key={shift} className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-sm font-semibold capitalize ${textP}`}>{shift} Shift</h3>
                        <span className={`text-lg font-bold ${data.efficiency >= 90 ? 'text-green-500' : data.efficiency >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {data.efficiency}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-2">
                        <div className={`h-full rounded-full ${data.efficiency >= 90 ? 'bg-green-500' : data.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${data.efficiency}%` }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={textS}>Production: {data.total_kg.toLocaleString()} kg</span>
                        <span className={textS}>Waste: {data.waste_kg.toLocaleString()} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className={`text-sm text-center py-16 ${textS}`}>No shift data</p>}
            </div>
          </div>

          {/* Production Volume */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className={`text-base font-semibold mb-4 ${textP}`}>Production Volume & Waste Analysis</h2>
            {efficiency?.daily_efficiency?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={efficiency.daily_efficiency}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                  <Legend />
                  <Bar dataKey="total_kg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Production (kg)" />
                  <Bar dataKey="waste_kg" fill="#ef4444" radius={[4, 4, 0, 0]} name="Waste (kg)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className={`text-sm text-center py-16 ${textS}`}>No production data</p>}
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-5 animate-fade-in">
          {performance && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Revenue', val: performance.current_month.revenue, change: performance.changes.revenue },
                { label: 'Expenses', val: performance.current_month.expenses, change: performance.changes.expenses },
                { label: 'Profit', val: performance.current_month.profit, change: performance.changes.profit },
                { label: 'Orders', val: performance.current_month.orders, change: performance.changes.orders, isCount: true },
                { label: 'Production', val: performance.current_month.production_kg, change: performance.changes.production, suffix: ' kg', isCount: true },
              ].map((item) => (
                <div key={item.label} className="kpi-card kpi-blue">
                  <p className={`text-xs ${textS}`}>{item.label}</p>
                  <p className={`text-lg font-bold ${textP}`}>
                    {item.isCount ? item.val.toLocaleString() : `Rs.${item.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}{item.suffix || ''}
                  </p>
                  <span className={`text-xs font-medium ${item.change > 0 ? 'text-green-500' : item.change < 0 ? 'text-red-500' : textS}`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Revenue & Profit Trend</h2>
              {profitForecast?.historical?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...profitForecast.historical, ...profitForecast.forecast.map((f: any) => ({ month: f.month, revenue: f.predicted_revenue, profit: f.predicted_profit }))]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickFill }} />
                    <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                    <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className={`text-sm text-center py-16 ${textS}`}>No financial data</p>}
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Expense Categories</h2>
              {expenseAnalytics?.by_category?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={expenseAnalytics.by_category.map((c: any) => ({
                        name: c.category.charAt(0).toUpperCase() + c.category.slice(1), value: c.current_amount,
                      }))}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                    >
                      {expenseAnalytics.by_category.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `Rs.${Number(v).toLocaleString()}`} contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className={`text-sm text-center py-16 ${textS}`}>No expense data</p>}
            </div>
          </div>

          {/* Cost Per Product */}
          {costPerProduct?.products?.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Production Cost Per Product</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-200'}`}>
                      <th className={`text-left py-2 px-3 font-medium ${textS}`}>Product</th>
                      <th className={`text-right py-2 px-3 font-medium ${textS}`}>Qty (kg)</th>
                      <th className={`text-right py-2 px-3 font-medium ${textS}`}>Material Cost</th>
                      <th className={`text-right py-2 px-3 font-medium ${textS}`}>Overhead</th>
                      <th className={`text-right py-2 px-3 font-medium ${textS}`}>Cost/kg</th>
                      <th className={`text-right py-2 px-3 font-medium ${textS}`}>Price</th>
                      <th className={`text-right py-2 px-3 font-medium ${textS}`}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costPerProduct.products.map((p: any) => (
                      <tr key={p.product_id} className={`border-b ${theme === 'dark' ? 'border-border-dark/50' : 'border-gray-100'}`}>
                        <td className={`py-2 px-3 font-medium ${textP}`}>{p.product_name}</td>
                        <td className={`py-2 px-3 text-right ${textP}`}>{p.quantity_kg.toLocaleString()}</td>
                        <td className={`py-2 px-3 text-right ${textP}`}>Rs.{p.material_cost.toLocaleString()}</td>
                        <td className={`py-2 px-3 text-right ${textS}`}>Rs.{p.overhead_allocated.toLocaleString()}</td>
                        <td className={`py-2 px-3 text-right font-bold ${textP}`}>Rs.{p.cost_per_kg}</td>
                        <td className={`py-2 px-3 text-right ${textP}`}>Rs.{p.selling_price}</td>
                        <td className={`py-2 px-3 text-right font-bold ${p.margin_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {p.margin_percent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 mt-3">
                <span className={`text-xs ${textS}`}>Total Overhead: Rs.{costPerProduct.total_overhead?.toLocaleString()}</span>
                <span className={`text-xs ${textS}`}>Electricity: Rs.{costPerProduct.total_electricity_cost?.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Profit Leak Detection */}
          {expenseAnalytics?.profit_leaks?.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className={`text-base font-semibold ${textP}`}>Profit Leak Detection</h2>
              </div>
              <p className={`text-xs mb-3 ${textS}`}>Categories with expenses increasing &gt;15% vs previous period</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expenseAnalytics.profit_leaks.map((leak: any, i: number) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                    theme === 'dark' ? 'bg-red-900/10 border border-red-900/20' : 'bg-red-50 border border-red-100'
                  }`}>
                    <div>
                      <p className={`text-sm font-medium capitalize ${textP}`}>{leak.category}</p>
                      <p className={`text-xs ${textS}`}>Rs.{leak.previous_amount.toLocaleString()} → Rs.{leak.current_amount.toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-bold text-red-500">+{leak.change_percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="kpi-card kpi-blue">
              <p className={`text-xs ${textS}`}>Total Products</p>
              <p className={`text-2xl font-bold ${textP}`}>{inventory?.total_products || 0}</p>
            </div>
            <div className="kpi-card kpi-red">
              <p className={`text-xs ${textS}`}>Critical Risk</p>
              <p className="text-2xl font-bold text-red-500">{inventory?.critical_count || 0}</p>
            </div>
            <div className="kpi-card kpi-orange">
              <p className={`text-xs ${textS}`}>High Risk</p>
              <p className="text-2xl font-bold text-orange-500">{inventory?.high_risk_count || 0}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-border-dark' : 'border-gray-200'}`}>
              <h2 className={`text-base font-semibold ${textP}`}>Inventory Shortage Risk Analysis</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <tr>
                    {['Product', 'SKU', 'Stock', 'Daily Usage', 'Days Left', 'Risk', 'Reorder Qty'].map((h) => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${textS}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(inventory?.products || []).slice(0, 20).map((p: any) => (
                    <tr key={p.product_id} className={`border-b ${theme === 'dark' ? 'border-border-dark hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 font-medium ${textP}`}>{p.product_name}</td>
                      <td className={`px-4 py-3 ${textS}`}>{p.sku}</td>
                      <td className={`px-4 py-3 ${textP}`}>{p.current_stock}</td>
                      <td className={`px-4 py-3 ${textP}`}>{p.daily_usage_rate}</td>
                      <td className={`px-4 py-3 font-semibold ${
                        p.days_until_stockout < 7 ? 'text-red-500' : p.days_until_stockout < 14 ? 'text-orange-500' : p.days_until_stockout < 30 ? 'text-yellow-500' : 'text-green-500'
                      }`}>{p.days_until_stockout > 365 ? '365+' : p.days_until_stockout}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.risk_level === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          p.risk_level === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          p.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>{p.risk_level}</span>
                      </td>
                      <td className={`px-4 py-3 font-medium ${textP}`}>{p.recommended_reorder_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Energy Tab */}
      {activeTab === 'energy' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Electricity Cost Forecast</h2>
              {elecForecast?.historical?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={[
                    ...elecForecast.historical.map((h: any) => ({ date: h.date, cost: h.cost })),
                    ...elecForecast.forecast.slice(0, 14).map((f: any) => ({ date: f.date, predicted: f.predicted_cost })),
                  ]}>
                    <defs>
                      <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                    <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="url(#gCost)" strokeWidth={2} name="Actual Cost" />
                    <Area type="monotone" dataKey="predicted" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} name="Predicted" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className={`text-sm text-center py-16 ${textS}`}>No electricity data</p>}
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Consumption by Department</h2>
              {elecDepts?.departments?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={elecDepts.departments.map((d: any) => ({ name: d.name, value: d.total_units }))}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                    >
                      {elecDepts.departments.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${Number(v).toLocaleString()} kWh`} contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className={`text-sm text-center py-16 ${textS}`}>No department data</p>}
            </div>
          </div>

          {elecDepts?.departments?.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Department Energy Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {elecDepts.departments.map((dept: any, i: number) => (
                  <div key={dept.name} className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <h3 className={`text-sm font-semibold ${textP}`}>{dept.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className={`text-xs ${textS}`}>Units</p>
                        <p className={`text-sm font-bold ${textP}`}>{dept.total_units.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${textS}`}>Share</p>
                        <p className={`text-sm font-bold ${textP}`}>{dept.percentage}%</p>
                      </div>
                      <div>
                        <p className={`text-xs ${textS}`}>Cost</p>
                        <p className={`text-sm font-bold ${textP}`}>Rs.{dept.estimated_cost.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peak Load Analytics */}
          {peakLoad && peakLoad.daily_loads?.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className={`text-base font-semibold mb-4 ${textP}`}>Peak Load Analytics (90 days)</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-red-50'}`}>
                  <p className={`text-xs ${textS}`}>Peak Day</p>
                  <p className={`text-sm font-bold text-red-500`}>{peakLoad.peak_day?.slice(5) || 'N/A'}</p>
                  <p className={`text-[10px] ${textS}`}>{peakLoad.peak_units} kWh</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-blue-50'}`}>
                  <p className={`text-xs ${textS}`}>Avg Daily</p>
                  <p className={`text-sm font-bold text-blue-500`}>{peakLoad.avg_daily_units} kWh</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-green-50'}`}>
                  <p className={`text-xs ${textS}`}>Load Factor</p>
                  <p className={`text-sm font-bold text-green-500`}>{peakLoad.load_factor}%</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-purple-50'}`}>
                  <p className={`text-xs ${textS}`}>Total Units</p>
                  <p className={`text-sm font-bold text-purple-500`}>{peakLoad.total_units?.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-amber-50'}`}>
                  <p className={`text-xs ${textS}`}>Total Cost</p>
                  <p className={`text-sm font-bold text-amber-500`}>Rs.{peakLoad.total_cost?.toLocaleString()}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={peakLoad.daily_loads}>
                  <defs>
                    <linearGradient id="gPeak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="units" stroke="#ef4444" fill="url(#gPeak)" strokeWidth={2} name="Daily Load (kWh)" />
                </AreaChart>
              </ResponsiveContainer>
              {peakLoad.weekday_averages && Object.keys(peakLoad.weekday_averages).length > 0 && (
                <div className="mt-4">
                  <h3 className={`text-sm font-semibold mb-2 ${textP}`}>Average by Weekday</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(peakLoad.weekday_averages).map(([day, avg]: [string, any]) => (
                      <div key={day} className={`px-3 py-2 rounded-lg text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <p className={`text-[10px] ${textS}`}>{day.slice(0, 3)}</p>
                        <p className={`text-xs font-bold ${textP}`}>{avg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Employee Efficiency */}
      {employeeEff && employeeEff.operators?.length > 0 && (
        <div className="glass-card rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-500" />
            <h2 className={`text-base font-semibold ${textP}`}>Employee Efficiency Analysis</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} ${textS}`}>
              {employeeEff.total_operators} operators \u2022 Avg {employeeEff.avg_efficiency}%
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employeeEff.operators.map((op: any, i: number) => (
              <div key={i} className={`rounded-xl border p-4 ${
                theme === 'dark' ? 'bg-white/5 border-border-dark' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${textP}`}>{op.operator}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    op.rating === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : op.rating === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : op.rating === 'average' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{op.rating.replace('_', ' ')}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mb-2">
                  <div className={`h-full rounded-full ${
                    op.efficiency >= 95 ? 'bg-green-500' : op.efficiency >= 85 ? 'bg-blue-500' : op.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} style={{ width: `${Math.min(op.efficiency, 100)}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div><p className={`text-[10px] ${textS}`}>Efficiency</p><p className={`text-xs font-bold ${textP}`}>{op.efficiency}%</p></div>
                  <div><p className={`text-[10px] ${textS}`}>Output</p><p className={`text-xs font-bold ${textP}`}>{op.total_production_kg} kg</p></div>
                  <div><p className={`text-[10px] ${textS}`}>Avg/Shift</p><p className={`text-xs font-bold ${textP}`}>{op.avg_per_shift} kg</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
