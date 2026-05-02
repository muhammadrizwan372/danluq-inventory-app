import { useEffect, useState } from 'react';
import api from '../api/client';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { btnStyles } from '../components/ui';

interface FinSummary { total_revenue: number; total_expenses: number; net_income: number; total_receivables: number; total_payables: number; cash_balance: number; }
interface PLItem { account_code: string; account_name: string; amount: number; }
interface PL { revenue_items: PLItem[]; expense_items: PLItem[]; total_revenue: number; total_expenses: number; net_income: number; period_days: number; }
interface BSItem { account_code: string; account_name: string; balance: number; }
interface BS { assets: BSItem[]; liabilities: BSItem[]; equity: BSItem[]; total_assets: number; total_liabilities: number; total_equity: number; }
interface CF { operating_inflows: number; operating_outflows: number; investing_inflows: number; investing_outflows: number; financing_inflows: number; financing_outflows: number; net_cash_flow: number; period_days: number; }

const Card = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${color}`}><Icon className="h-5 w-5 text-white" /></div><div><p className="text-sm text-gray-500">{title}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></div>
  </div>
);
const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';
const fmt = (n: number) => '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function FinancialReports() {
  const [summary, setSummary] = useState<FinSummary | null>(null);
  const [pl, setPL] = useState<PL | null>(null);
  const [bs, setBS] = useState<BS | null>(null);
  const [cf, setCF] = useState<CF | null>(null);
  const [period, setPeriod] = useState(30);
  const [tab, setTab] = useState<'summary' | 'pl' | 'bs' | 'cf'>('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/financial-reports/summary'),
      api.get('/financial-reports/profit-loss', { params: { days: period } }),
      api.get('/financial-reports/balance-sheet'),
      api.get('/financial-reports/cash-flow', { params: { days: period } }),
    ]).then(([s, p, b, c]) => { setSummary(s.data); setPL(p.data); setBS(b.data); setCF(c.data); setLoading(false); });
  }, [period]);

  if (loading || !summary) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'pl', label: 'Profit & Loss' },
    { key: 'bs', label: 'Balance Sheet' },
    { key: 'cf', label: 'Cash Flow' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((d) => (
            <button key={d} className={period === d ? btnStyles.primary : btnStyles.secondary} onClick={() => setPeriod(d)}>{d === 365 ? '1Y' : `${d}D`}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`} onClick={() => setTab(t.key as any)}>{t.label}</button>
        ))}
      </div>

      {tab === 'summary' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card title="Total Revenue" value={fmt(summary.total_revenue)} icon={TrendingUp} color="bg-green-500" />
            <Card title="Total Expenses" value={fmt(summary.total_expenses)} icon={TrendingDown} color="bg-red-500" />
            <Card title="Net Income" value={`${summary.net_income >= 0 ? '' : '-'}${fmt(summary.net_income)}`} icon={DollarSign} color={summary.net_income >= 0 ? 'bg-blue-500' : 'bg-red-500'} />
            <Card title="Receivables" value={fmt(summary.total_receivables)} icon={TrendingUp} color="bg-yellow-500" />
            <Card title="Payables" value={fmt(summary.total_payables)} icon={TrendingDown} color="bg-orange-500" />
            <Card title="Cash Balance" value={fmt(summary.cash_balance)} icon={BarChart3} color="bg-purple-500" />
          </div>
        </div>
      )}

      {tab === 'pl' && pl && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50"><h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Profit & Loss Statement — Last {pl.period_days} Days</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH} colSpan={2}>Revenue</th></tr></thead>
              <tbody>
                {pl.revenue_items.length === 0 ? <tr><td className={`${TD} text-gray-400`} colSpan={2}>No revenue entries</td></tr> : pl.revenue_items.map((i) => <tr key={i.account_code}><td className={`${TD} font-medium`}>{i.account_code} - {i.account_name}</td><td className={`${TD} text-right text-green-600`}>{fmt(i.amount)}</td></tr>)}
                <tr className="bg-green-50 font-semibold"><td className={TD}>Total Revenue</td><td className={`${TD} text-right text-green-600`}>{fmt(pl.total_revenue)}</td></tr>
              </tbody>
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH} colSpan={2}>Expenses</th></tr></thead>
              <tbody>
                {pl.expense_items.length === 0 ? <tr><td className={`${TD} text-gray-400`} colSpan={2}>No expense entries</td></tr> : pl.expense_items.map((i) => <tr key={i.account_code}><td className={`${TD} font-medium`}>{i.account_code} - {i.account_name}</td><td className={`${TD} text-right text-red-600`}>{fmt(i.amount)}</td></tr>)}
                <tr className="bg-red-50 font-semibold"><td className={TD}>Total Expenses</td><td className={`${TD} text-right text-red-600`}>{fmt(pl.total_expenses)}</td></tr>
              </tbody>
              <tbody>
                <tr className={`font-bold text-lg ${pl.net_income >= 0 ? 'bg-green-100' : 'bg-red-100'}`}><td className="px-4 py-4">Net Income</td><td className="px-4 py-4 text-right">{pl.net_income >= 0 ? '' : '-'}{fmt(pl.net_income)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'bs' && bs && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50"><h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Balance Sheet</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH} colSpan={2}>Assets</th></tr></thead>
              <tbody>
                {bs.assets.length === 0 ? <tr><td className={`${TD} text-gray-400`} colSpan={2}>No asset accounts</td></tr> : bs.assets.map((a) => <tr key={a.account_code}><td className={`${TD} font-medium`}>{a.account_code} - {a.account_name}</td><td className={`${TD} text-right`}>{fmt(a.balance)}</td></tr>)}
                <tr className="bg-blue-50 font-semibold"><td className={TD}>Total Assets</td><td className={`${TD} text-right`}>{fmt(bs.total_assets)}</td></tr>
              </tbody>
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH} colSpan={2}>Liabilities</th></tr></thead>
              <tbody>
                {bs.liabilities.length === 0 ? <tr><td className={`${TD} text-gray-400`} colSpan={2}>No liability accounts</td></tr> : bs.liabilities.map((l) => <tr key={l.account_code}><td className={`${TD} font-medium`}>{l.account_code} - {l.account_name}</td><td className={`${TD} text-right`}>{fmt(l.balance)}</td></tr>)}
                <tr className="bg-red-50 font-semibold"><td className={TD}>Total Liabilities</td><td className={`${TD} text-right`}>{fmt(bs.total_liabilities)}</td></tr>
              </tbody>
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH} colSpan={2}>Equity</th></tr></thead>
              <tbody>
                {bs.equity.length === 0 ? <tr><td className={`${TD} text-gray-400`} colSpan={2}>No equity accounts</td></tr> : bs.equity.map((eq) => <tr key={eq.account_code}><td className={`${TD} font-medium`}>{eq.account_code} - {eq.account_name}</td><td className={`${TD} text-right`}>{fmt(eq.balance)}</td></tr>)}
                <tr className="bg-purple-50 font-semibold"><td className={TD}>Total Equity</td><td className={`${TD} text-right`}>{fmt(bs.total_equity)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'cf' && cf && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50"><h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Cash Flow Statement — Last {cf.period_days} Days</h2></div>
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 uppercase">Operating Activities</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-gray-600">Inflows</span><p className="text-lg font-semibold text-green-600">{fmt(cf.operating_inflows)}</p></div>
                <div><span className="text-sm text-gray-600">Outflows</span><p className="text-lg font-semibold text-red-600">{fmt(cf.operating_outflows)}</p></div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200"><span className="text-sm text-gray-600">Net</span><p className="text-lg font-bold">{fmt(cf.operating_inflows - cf.operating_outflows)}</p></div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-yellow-800 mb-3 uppercase">Investing Activities</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-gray-600">Inflows</span><p className="text-lg font-semibold text-green-600">{fmt(cf.investing_inflows)}</p></div>
                <div><span className="text-sm text-gray-600">Outflows</span><p className="text-lg font-semibold text-red-600">{fmt(cf.investing_outflows)}</p></div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-purple-800 mb-3 uppercase">Financing Activities</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-gray-600">Inflows</span><p className="text-lg font-semibold text-green-600">{fmt(cf.financing_inflows)}</p></div>
                <div><span className="text-sm text-gray-600">Outflows</span><p className="text-lg font-semibold text-red-600">{fmt(cf.financing_outflows)}</p></div>
              </div>
            </div>
            <div className={`rounded-xl p-5 ${cf.net_cash_flow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="text-sm font-semibold uppercase">Net Cash Flow</h3>
              <p className={`text-2xl font-bold ${cf.net_cash_flow >= 0 ? 'text-green-700' : 'text-red-700'}`}>{cf.net_cash_flow >= 0 ? '' : '-'}{fmt(cf.net_cash_flow)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
