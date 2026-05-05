import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Eye, X, Trash2 } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface OrderItem { id: number; product_id: number; quantity: number; unit_price: number; total: number; product_name?: string; }
interface Order { id: number; order_number: string; customer_id: number; status: string; subtotal: number; tax: number; discount: number; total: number; notes?: string; created_at: string; customer?: { id: number; name: string }; items: OrderItem[]; }
interface Customer { id: number; name: string; }
interface Product { id: number; name: string; sku: string; price: number; stock_quantity: number; }

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [form, setForm] = useState({ customer_id: '', tax: '0', discount: '0', notes: '' });
  const [items, setItems] = useState<{ product_id: string; quantity: string; unit_price: string }[]>([]);

  const fetchOrders = () => { api.get('/orders/').then((r) => { setOrders(r.data); setLoading(false); }); };
  useEffect(() => { fetchOrders(); api.get('/customers/').then((r) => setCustomers(r.data)); api.get('/products').then((r) => setProducts(r.data)); }, []);

  const openCreate = () => { setForm({ customer_id: '', tax: '0', discount: '0', notes: '' }); setItems([{ product_id: '', quantity: '1', unit_price: '' }]); setShowModal(true); };
  const addItem = () => setItems([...items, { product_id: '', quantity: '1', unit_price: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    const newItems = [...items]; (newItems[i] as any)[field] = value;
    if (field === 'product_id') { const p = products.find((p) => p.id === parseInt(value)); if (p) newItems[i].unit_price = p.price.toString(); }
    setItems(newItems);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/orders/', { customer_id: parseInt(form.customer_id), tax: parseFloat(form.tax), discount: parseFloat(form.discount), notes: form.notes || null, items: items.map((item) => ({ product_id: parseInt(item.product_id), quantity: parseInt(item.quantity), unit_price: parseFloat(item.unit_price) })) });
    setShowModal(false); fetchOrders();
  };
  const updateStatus = async (id: number, status: string) => { await api.put(`/orders/${id}`, { status }); fetchOrders(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> New Order</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Order #</th><th className={TH}>Customer</th><th className={TH}>Status</th><th className={TH}>Total</th><th className={TH}>Date</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {orders.length === 0 ? <tr><td colSpan={6} className="text-center text-gray-400 py-8">No orders yet</td></tr> : orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{o.order_number}</td>
                  <td className={TD}>{o.customer?.name || '-'}</td>
                  <td className={TD}><span className={getStatusBadgeClass(o.status)}>{o.status}</span></td>
                  <td className={`${TD} font-medium`}>Rs.{o.total.toFixed(2)}</td>
                  <td className={`${TD} text-gray-500`}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className={TD}>
                    <div className="flex gap-1 flex-wrap">
                      <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => setShowDetail(o)}><Eye className="h-3.5 w-3.5" /></button>
                      {o.status === 'pending' && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => updateStatus(o.id, 'confirmed')}>Confirm</button>}
                      {o.status === 'confirmed' && <button className={`${btnStyles.primary} ${btnStyles.sm}`} onClick={() => updateStatus(o.id, 'processing')}>Process</button>}
                      {o.status === 'processing' && <button className={`${btnStyles.primary} ${btnStyles.sm}`} onClick={() => updateStatus(o.id, 'shipped')}>Ship</button>}
                      {o.status === 'shipped' && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => updateStatus(o.id, 'delivered')}>Delivered</button>}
                      {!['cancelled', 'delivered'].includes(o.status) && <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">Order {showDetail.order_number}</h2><button onClick={() => setShowDetail(null)}><X className="h-5 w-5" /></button></div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><span className="text-sm text-gray-500">Customer:</span><p className="font-medium">{showDetail.customer?.name}</p></div>
                <div><span className="text-sm text-gray-500">Status:</span><p><span className={getStatusBadgeClass(showDetail.status)}>{showDetail.status}</span></p></div>
                <div><span className="text-sm text-gray-500">Date:</span><p>{new Date(showDetail.created_at).toLocaleString()}</p></div>
                <div><span className="text-sm text-gray-500">Total:</span><p className="font-bold text-lg">Rs.{showDetail.total.toFixed(2)}</p></div>
              </div>
              <table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className={TH}>Product</th><th className={TH}>Qty</th><th className={TH}>Price</th><th className={TH}>Total</th></tr></thead>
                <tbody>{showDetail.items.map((item) => (<tr key={item.id}><td className={TD}>{item.product_name || `Product #${item.product_id}`}</td><td className={TD}>{item.quantity}</td><td className={TD}>Rs.{item.unit_price.toFixed(2)}</td><td className={`${TD} font-medium`}>Rs.{item.total.toFixed(2)}</td></tr>))}</tbody>
              </table>
              <div className="mt-4 text-right space-y-1 text-sm"><p>Subtotal: Rs.{showDetail.subtotal.toFixed(2)}</p><p>Tax: Rs.{showDetail.tax.toFixed(2)}</p><p>Discount: -Rs.{showDetail.discount.toFixed(2)}</p><p className="text-lg font-bold">Total: Rs.{showDetail.total.toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">New Order</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelStyle}>Customer *</label><select className={selectStyle} value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className={`${labelStyle} mb-0`}>Items *</label><button type="button" className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={addItem}><Plus className="h-3.5 w-3.5" /> Add Item</button></div>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select className={`${selectStyle} flex-1`} value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)} required><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} in stock)</option>)}</select>
                    <input type="number" className={`${inputStyle} w-20`} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} min="1" required />
                    <input type="number" step="0.01" className={`${inputStyle} w-28`} placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} required />
                    {items.length > 1 && <button type="button" className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => removeItem(i)}><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Tax</label><input type="number" step="0.01" className={inputStyle} value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
                <div><label className={labelStyle}>Discount</label><input type="number" step="0.01" className={inputStyle} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
              </div>
              <div><label className={labelStyle}>Notes</label><textarea className={inputStyle} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>Create Order</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
