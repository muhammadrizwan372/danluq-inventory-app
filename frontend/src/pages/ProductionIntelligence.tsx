import { useEffect, useState } from 'react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { Activity, TrendingUp, Factory, AlertTriangle, Clock, Gauge, RefreshCw, Users, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ProductionIntelligence() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [summary, setSummary] = useState<any[]>([]);
  const [machines, setMachines] = useState<any>(null);
  const [downtime, setDowntime] = useState<any>(null);
  const [hourly, setHourly] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/production/efficiency').then((r) => r.data).catch(() => null),
      api.get('/analytics/predict/production').then((r) => r.data).catch(() => null),
      api.get('/production/summary').then((r) => r.data).catch(() => []),
      api.get('/analytics/production/machines').then((r) => r.data).catch(() => null),
      api.get('/analytics/production/downtime').then((r) => r.data).catch(() => null),
      api.get('/analytics/production/hourly').then((r) => r.data).catch(() => null),
    ]).then(([eff, fc, sum, mach, dt, hr]) => {
      setEfficiency(eff);
      setForecast(fc);
      setSummary(sum || []);
      setMachines(mach);
      setDowntime(dt);
      setHourly(hr);
    }).finally(() => setLoading(false));
  }, []);

  const textP = theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary';
  const textS = theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary';
  const gridStroke = theme === 'dark' ? '#313244' : '#e5e7eb';
  const tickFill = theme === 'dark' ? '#a6adc8' : '#6b7280';
  const tooltipBg = theme === 'dark' ? '#1e1e2e' : '#fff';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
        <p className={`text-sm ${textS}`}>Loading production intelligence...</p>
      </div>
    </div>
  );

  const summaryData = summary.slice(0, 30).reverse().map((s: any) => ({
    date: s.date,
    day: s.day_total_kg,
    night: s.night_total_kg,
    total: s.total_kg,
    waste: s.total_waste_kg,
    efficiency: s.total_kg + s.total_waste_kg > 0
      ? Math.round((s.total_kg / (s.total_kg + s.total_waste_kg)) * 100)
      : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${textP}`}>Production Intelligence</h1>
        <p className={`text-sm ${textS}`}>Advanced production monitoring, shift analytics & wastage analysis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="kpi-card kpi-blue animate-fade-in-up">
          <p className={`text-xs ${textS}`}>Monthly Efficiency</p>
          <p className={`text-2xl font-bold ${textP}`}>{efficiency?.current_month_efficiency || 0}%</p>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mt-2">
            <div className={`h-full rounded-full ${(efficiency?.current_month_efficiency || 0) >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${efficiency?.current_month_efficiency || 0}%` }} />
          </div>
        </div>
        <div className="kpi-card kpi-purple animate-fade-in-up stagger-1">
          <p className={`text-xs ${textS}`}>Weekly Efficiency</p>
          <p className={`text-2xl font-bold ${textP}`}>{efficiency?.weekly_efficiency || 0}%</p>
        </div>
        <div className={`kpi-card ${(efficiency?.efficiency_change || 0) >= 0 ? 'kpi-green' : 'kpi-red'} animate-fade-in-up stagger-2`}>
          <p className={`text-xs ${textS}`}>Change vs Last Month</p>
          <p className={`text-xl font-bold ${(efficiency?.efficiency_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {(efficiency?.efficiency_change || 0) > 0 ? '+' : ''}{efficiency?.efficiency_change || 0}%
          </p>
        </div>
        <div className="kpi-card kpi-cyan animate-fade-in-up stagger-3">
          <p className={`text-xs ${textS}`}>Daily Average</p>
          <p className={`text-2xl font-bold ${textP}`}>{forecast?.current_daily_avg || 0}</p>
          <p className={`text-[10px] ${textS}`}>kg/day</p>
        </div>
        <div className="kpi-card kpi-orange animate-fade-in-up stagger-4">
          <p className={`text-xs ${textS}`}>Forecast Trend</p>
          <p className={`text-lg font-bold capitalize ${
            forecast?.trend === 'increasing' ? 'text-green-500' : forecast?.trend === 'decreasing' ? 'text-red-500' : textP
          }`}>{forecast?.trend || 'N/A'}</p>
        </div>
        <div className="kpi-card kpi-blue animate-fade-in-up stagger-5">
          <p className={`text-xs ${textS}`}>AI Confidence</p>
          <p className={`text-2xl font-bold ${textP}`}>{forecast?.confidence || 0}%</p>
        </div>
      </div>

      {/* Shift Analysis */}
      {efficiency?.shift_efficiency && Object.keys(efficiency.shift_efficiency).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(efficiency.shift_efficiency).map(([shift, data]: [string, any]) => (
            <div key={shift} className="glass-card rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {shift === 'day' ? <Clock className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
                  <h3 className={`text-base font-semibold capitalize ${textP}`}>{shift} Shift</h3>
                </div>
                <span className={`text-2xl font-bold ${data.efficiency >= 90 ? 'text-green-500' : data.efficiency >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {data.efficiency}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-3">
                <div className={`h-full rounded-full transition-all duration-500 ${
                  data.efficiency >= 90 ? 'bg-green-500' : data.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ width: `${data.efficiency}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${textS}`}>Production</p>
                  <p className={`text-sm font-bold ${textP}`}>{data.total_kg.toLocaleString()} kg</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${textS}`}>Waste</p>
                  <p className="text-sm font-bold text-red-500">{data.waste_kg.toLocaleString()} kg</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Shift-wise Production */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className={`text-base font-semibold mb-4 ${textP}`}>Day vs Night Production</h2>
          {summaryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="day" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Day Shift (kg)" stackId="a" />
                <Bar dataKey="night" fill="#6366f1" radius={[4, 4, 0, 0]} name="Night Shift (kg)" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className={`text-sm text-center py-16 ${textS}`}>No production summary data</p>}
        </div>

        {/* Wastage Analysis */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className={`text-base font-semibold mb-4 ${textP}`}>Wastage Analysis</h2>
          {summaryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={summaryData}>
                <defs>
                  <linearGradient id="gWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                <Area type="monotone" dataKey="waste" stroke="#ef4444" fill="url(#gWaste)" strokeWidth={2} name="Waste (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className={`text-sm text-center py-16 ${textS}`}>No waste data</p>}
        </div>
      </div>

      {/* Production Forecast */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-semibold ${textP}`}>30-Day Production Forecast</h2>
          <span className={`text-xs px-2.5 py-1 rounded-full ${
            forecast?.trend === 'increasing' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            forecast?.trend === 'decreasing' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            Confidence: {forecast?.confidence || 0}%
          </span>
        </div>
        {forecast?.historical?.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={[
              ...forecast.historical.map((h: any) => ({ date: h.date, actual: h.actual_kg })),
              ...forecast.forecast.slice(0, 30).map((f: any) => ({ date: f.date, predicted: f.predicted_kg })),
            ]}>
              <defs>
                <linearGradient id="gA2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                <linearGradient id="gP2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: tickFill }} />
              <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
              <Legend />
              <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="url(#gA2)" strokeWidth={2} name="Actual (kg)" />
              <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="url(#gP2)" strokeWidth={2} strokeDasharray="5 5" name="Predicted (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className={`text-sm text-center py-16 ${textS}`}>Insufficient data for production forecasting</p>}
      </div>

      {/* Machine-wise Production */}
      {machines?.machines && machines.machines.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Factory className="h-5 w-5 text-purple-500" />
            <h2 className={`text-base font-semibold ${textP}`}>Machine / Operator Performance</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} ${textS}`}>
              {machines.total_machines} units • Avg {machines.avg_efficiency}%
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {machines.machines.map((m: any, i: number) => (
              <div key={i} className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                theme === 'dark' ? 'bg-white/5 border-border-dark' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${textP}`}>{m.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.status === 'efficient' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : m.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{m.efficiency}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mb-2">
                  <div className={`h-full rounded-full ${
                    m.efficiency >= 90 ? 'bg-green-500' : m.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} style={{ width: `${Math.min(m.efficiency, 100)}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div><p className={`text-[10px] ${textS}`}>Output</p><p className={`text-xs font-bold ${textP}`}>{m.total_kg.toLocaleString()} kg</p></div>
                  <div><p className={`text-[10px] ${textS}`}>Waste</p><p className="text-xs font-bold text-red-500">{m.waste_kg} kg</p></div>
                  <div><p className={`text-[10px] ${textS}`}>Share</p><p className={`text-xs font-bold ${textP}`}>{m.share_percent}%</p></div>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  {m.change_vs_prev > 0 ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : m.change_vs_prev < 0 ? <ArrowDownRight className="h-3 w-3 text-red-500" /> : null}
                  <span className={`text-[10px] ${m.change_vs_prev > 0 ? 'text-green-500' : m.change_vs_prev < 0 ? 'text-red-500' : textS}`}>
                    {m.change_vs_prev > 0 ? '+' : ''}{m.change_vs_prev}% vs prev
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downtime Analysis */}
      {downtime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-5 w-5 text-red-500" />
              <h2 className={`text-base font-semibold ${textP}`}>Uptime & Downtime</h2>
            </div>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <p className={`text-3xl font-bold ${downtime.uptime_percent >= 90 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {downtime.uptime_percent}%
                </p>
                <p className={`text-xs ${textS}`}>Uptime</p>
              </div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${downtime.uptime_percent}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-[10px] ${textS}`}>{downtime.active_days} active days</span>
                  <span className={`text-[10px] ${textS}`}>{downtime.inactive_days} inactive</span>
                </div>
              </div>
            </div>
            {downtime.no_production_dates?.length > 0 && (
              <div>
                <p className={`text-xs font-medium mb-2 ${textS}`}>No-production dates</p>
                <div className="flex flex-wrap gap-1.5">
                  {downtime.no_production_dates.map((d: string, i: number) => (
                    <span key={i} className={`text-[10px] px-2 py-1 rounded-md ${
                      theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                    }`}>{d.slice(5)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h2 className={`text-base font-semibold ${textP}`}>High Waste Events ({downtime.total_high_waste_events})</h2>
            </div>
            {downtime.high_waste_events?.length > 0 ? (
              <div className="space-y-2">
                {downtime.high_waste_events.slice(0, 6).map((evt: any, i: number) => (
                  <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                  }`}>
                    <div>
                      <p className={`text-xs font-medium ${textP}`}>{evt.date}</p>
                      <p className={`text-[10px] ${textS}`}>{evt.operator}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-500">{evt.waste_percent}%</p>
                      <p className={`text-[10px] ${textS}`}>{evt.waste_kg} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className={`text-sm text-center py-8 ${textS}`}>No high-waste events detected</p>}
          </div>
        </div>
      )}

      {/* Hourly / Shift Production Comparison */}
      {hourly && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-cyan-500" />
            <h2 className={`text-base font-semibold ${textP}`}>Shift Production Patterns</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-amber-50'}`}>
              <p className={`text-xs ${textS}`}>Avg Day Output</p>
              <p className={`text-lg font-bold text-amber-500`}>{hourly.avg_day_production} kg</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-indigo-50'}`}>
              <p className={`text-xs ${textS}`}>Avg Night Output</p>
              <p className={`text-lg font-bold text-indigo-500`}>{hourly.avg_night_production} kg</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-green-50'}`}>
              <p className={`text-xs ${textS}`}>Peak Shift</p>
              <p className={`text-lg font-bold capitalize text-green-500`}>{hourly.peak_shift}</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-xs ${textS}`}>Total Production</p>
              <p className={`text-lg font-bold ${textP}`}>{(hourly.total_day_production + hourly.total_night_production).toLocaleString()} kg</p>
            </div>
          </div>
          {hourly.daily_breakdown?.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hourly.daily_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: tickFill }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: tickFill }} />
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="day_kg" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Day (kg)" stackId="shift" />
                <Bar dataKey="night_kg" fill="#6366f1" radius={[3, 3, 0, 0]} name="Night (kg)" stackId="shift" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Efficiency Trend */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className={`text-base font-semibold mb-4 ${textP}`}>Daily Efficiency Heatmap</h2>
        {efficiency?.daily_efficiency?.length > 0 ? (
          <div className="grid grid-cols-7 gap-1.5">
            {efficiency.daily_efficiency.map((day: any, i: number) => {
              const eff = day.efficiency;
              const bg = eff >= 95 ? 'bg-green-500' : eff >= 90 ? 'bg-green-400' : eff >= 85 ? 'bg-yellow-400' : eff >= 80 ? 'bg-orange-400' : 'bg-red-400';
              return (
                <div
                  key={i}
                  className={`${bg} rounded-lg p-2 text-center text-white cursor-default transition-transform hover:scale-105`}
                  title={`${day.date}: ${eff}% efficiency, ${day.total_kg}kg produced`}
                >
                  <p className="text-[9px] opacity-80">{day.date.slice(5)}</p>
                  <p className="text-xs font-bold">{eff}%</p>
                </div>
              );
            })}
          </div>
        ) : <p className={`text-sm text-center py-10 ${textS}`}>No efficiency data for heatmap</p>}
      </div>
    </div>
  );
}

function Moon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  );
}
