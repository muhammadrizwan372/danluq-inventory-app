import { useEffect, useState } from 'react';
import api from '../api/client';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { selectStyle } from '../components/ui';

interface SalesSummary { period_days: number; total_revenue: number; total_orders: number; average_order_value: number; }
interface StockReport { total_products: number; total_stock_value: number; low_stock_count: number; out_of_stock_count: number; low_stock_items: Array<{ id: number; name: string; sku: string; stock_quantity: number; reorder_level: number; cost: number }>; }
interface TopSelling { period_days: number; products: Array<{ id: number; name: string; sku: string; total_sold: number; total_revenue: number }>; }
interface SalesByCategory { period_days: number; categories: Array<{ category: string; total_revenue: number; total_sold: number }>; }

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Reports() {
  const [days, setDays] = useState(30);
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [stock, setStock] = useState<StockReport | null>(null);
  const [topSelling, setTopSelling] = useState<TopSelling | null>(null);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/reports/sales-summary', { params: { days } }), api.get('/reports/stock-report'), api.get('/reports/top-selling', { params: { days, limit: 10 } }), api.get('/reports/sales-by-category', { params: { days } })])
      .then(([s, st, ts, sc]) => { setSales(s.data); setStock(st.data); setTopSelling(ts.data); setSalesByCategory(sc.data); })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center gap-2"><span className="text-sm text-gray-500">Period:</span><select className={`${selectStyle} w-auto`} value={days} onChange={(e) => setDays(parseInt(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last year</option></select></div>
      </div>

      {sales && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Revenue ({days}d)</p><p className="text-2xl font-bold text-gray-900">${sales.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div><div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center"><DollarSign className="h-6 w-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Orders ({days}d)</p><p className="text-2xl font-bold text-gray-900">{sales.total_orders}</p></div><div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Avg Order Value</p><p className="text-2xl font-bold text-gray-900">${sales.average_order_value.toFixed(2)}</p></div><div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center"><BarChart3 className="h-6 w-6 text-white" /></div></div></div>
        </div>
      )}

      {stock && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Total Products</p><p className="text-xl font-bold">{stock.total_products}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Stock Value</p><p className="text-xl font-bold">${stock.total_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Low Stock</p><p className="text-xl font-bold text-yellow-600">{stock.low_stock_count}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-xl font-bold text-red-600">{stock.out_of_stock_count}</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topSelling && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Top Selling Products</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Product</th><th className={TH}>SKU</th><th className={TH}>Sold</th><th className={TH}>Revenue</th></tr></thead>
              <tbody>{topSelling.products.length === 0 ? <tr><td colSpan={4} className="text-center text-gray-400 py-8">No data yet</td></tr> : topSelling.products.map((p) => (<tr key={p.id} className="hover:bg-gray-50"><td className={`${TD} font-medium`}>{p.name}</td><td className={`${TD} text-gray-500`}>{p.sku}</td><td className={TD}>{p.total_sold}</td><td className={`${TD} font-medium`}>${p.total_revenue.toFixed(2)}</td></tr>))}</tbody>
            </table></div>
          </div>
        )}
        {salesByCategory && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold">Sales by Category</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Category</th><th className={TH}>Units Sold</th><th className={TH}>Revenue</th></tr></thead>
              <tbody>{salesByCategory.categories.length === 0 ? <tr><td colSpan={3} className="text-center text-gray-400 py-8">No data yet</td></tr> : salesByCategory.categories.map((c, i) => (<tr key={i} className="hover:bg-gray-50"><td className={`${TD} font-medium`}>{c.category}</td><td className={TD}>{c.total_sold}</td><td className={`${TD} font-medium`}>${c.total_revenue.toFixed(2)}</td></tr>))}</tbody>
            </table></div>
          </div>
        )}
      </div>
    </div>
  );
}
