import { useEffect, useState } from 'react';
import api from '../api/client';
import { getStatusBadgeClass } from '../components/ui';
import {
  Package,
  ShoppingCart,
  Users,
  Truck,
  DollarSign,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface DashboardData {
  stats: {
    total_products: number;
    total_orders: number;
    total_customers: number;
    total_suppliers: number;
    total_revenue: number;
    pending_orders: number;
    low_stock_count: number;
  };
  low_stock_products: Array<{
    id: number; name: string; sku: string; stock_quantity: number; reorder_level: number;
  }>;
  recent_orders: Array<{
    id: number; order_number: string; customer_name: string; total: number; status: string; created_at: string;
  }>;
  top_products: Array<{
    id: number; name: string; sku: string; total_sold: number; total_revenue: number;
  }>;
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/').then((res) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!data) return <p className="text-gray-500">Failed to load dashboard</p>;

  const { stats } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Products" value={stats.total_products} icon={Package} color="bg-blue-600" />
        <StatCard title="Total Orders" value={stats.total_orders} icon={ShoppingCart} color="bg-green-600" />
        <StatCard title="Total Revenue" value={`Rs.${stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} color="bg-emerald-600" />
        <StatCard title="Pending Orders" value={stats.pending_orders} icon={Clock} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Customers" value={stats.total_customers} icon={Users} color="bg-purple-600" />
        <StatCard title="Suppliers" value={stats.total_suppliers} icon={Truck} color="bg-cyan-600" />
        <StatCard title="Low Stock Items" value={stats.low_stock_count} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-8">No orders yet</td></tr>
                ) : data.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-100 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3 border-b border-gray-100">{order.customer_name}</td>
                    <td className="px-4 py-3 border-b border-gray-100">Rs.{order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 border-b border-gray-100"><span className={getStatusBadgeClass(order.status)}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Reorder</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock_products.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-8">No low stock items</td></tr>
                ) : data.low_stock_products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-100 font-medium">{product.name}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-500">{product.sku}</td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <span className={product.stock_quantity === 0 ? 'text-red-600 font-semibold' : 'text-yellow-600'}>{product.stock_quantity}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">{product.reorder_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
