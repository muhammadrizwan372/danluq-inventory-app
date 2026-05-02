import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Eye, X, Trash2 } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface POItem { id: number; product_id: number; quantity: number; unit_cost: number; total: number; product_name?: string; }
interface PurchaseOrder { id: number; po_number: string; supplier_id: number; status: string; subtotal: number; tax: number; total: number; notes?: string; expected_date?: string; created_at: string; supplier?: { id: number; name: string }; items: POItem[]; }
interface Supplier { id: number; name: string; }
interface Product { id: number; name: string; sku: string; cost: number; }

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function PurchaseOrders() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({ supplier_id: '', tax: '0', notes: '', expected_date: '' });
  const [items, setItems] = useState<{ product_id: string; quantity: string; unit_cost: string }[]>([]);

  const fetchData = () => { api.get('/purchase-orders/').then((r) => { setPos(r.data); setLoading(false); }); };
  useEffect(() => { fetchData(); api.get('/suppliers/').then((r) => setSuppliers(r.data)); api.get('/products').then((r) => setProducts(r.data)); }, []);

  const openCreate = () => { setForm({ supplier_id: '', tax: '0', notes: '', expected_date: '' }); setItems([{ product_id: '', quantity: '1', unit_cost: '' }]); setShowModal(true); };
  const addItem = () => setItems([...items, { product_id: '', quantity: '1', unit_cost: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    const newItems = [...items]; (newItems[i] as any)[field] = value;
    if (field === 'product_id') { const p = products.find((p) => p.id === parseInt(value)); if (p) newItems[i].unit_cost = p.cost.toString(); }
    setItems(newItems);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/purchase-orders/', { supplier_id: parseInt(form.supplier_id), tax: parseFloat(form.tax), notes: form.notes || null, expected_date: form.expected_date || null, items: items.map((item) => ({ product_id: parseInt(item.product_id), quantity: parseInt(item.quantity), unit_cost: parseFloat(item.unit_cost) })) });
    setShowModal(false); fetchData();
  };
  const updateStatus = async (id: number, status: string) => { await api.put(`/purchase-orders/${id}`, { status }); fetchData(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> New PO</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>PO #</th><th className={TH}>Supplier</th><th className={TH}>Status</th><th className={TH}>Total</th><th className={TH}>Expected</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {pos.length === 0 ? <tr><td colSpan={6} className="text-center text-gray-400 py-8">No purchase orders yet</td></tr> : pos.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{po.po_number}</td>
                  <td className={TD}>{po.supplier?.name || '-'}</td>
                  <td className={TD}><span className={getStatusBadgeClass(po.status)}>{po.status}</span></td>
                  <td className={`${TD} font-medium`}>${po.total.toFixed(2)}</td>
                  <td className={`${TD} text-gray-500`}>{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}</td>
                  <td className={TD}>
                    <div className="flex gap-1">
                      <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => setShowDetail(po)}><Eye className="h-3.5 w-3.5" /></button>
                      {po.status === 'draft' && <button className={`${btnStyles.primary} ${btnStyles.sm}`} onClick={() => updateStatus(po.id, 'sent')}>Send</button>}
                      {po.status === 'sent' && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => updateStatus(po.id, 'received')}>Received</button>}
                      {!['cancelled', 'received'].includes(po.status) && <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => updateStatus(po.id, 'cancelled')}>Cancel</button>}
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
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">PO {showDetail.po_number}</h2><button onClick={() => setShowDetail(null)}><X className="h-5 w-5" /></button></div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><span className="text-sm text-gray-500">Supplier:</span><p className="font-medium">{showDetail.supplier?.name}</p></div>
                <div><span className="text-sm text-gray-500">Status:</span><p><span className={getStatusBadgeClass(showDetail.status)}>{showDetail.status}</span></p></div>
              </div>
              <table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className={TH}>Product</th><th className={TH}>Qty</th><th className={TH}>Cost</th><th className={TH}>Total</th></tr></thead>
                <tbody>{showDetail.items.map((item) => (<tr key={item.id}><td className={TD}>{item.product_name || `Product #${item.product_id}`}</td><td className={TD}>{item.quantity}</td><td className={TD}>${item.unit_cost.toFixed(2)}</td><td className={`${TD} font-medium`}>${item.total.toFixed(2)}</td></tr>))}</tbody>
              </table>
              <div className="mt-4 text-right text-sm space-y-1"><p>Subtotal: ${showDetail.subtotal.toFixed(2)}</p><p>Tax: ${showDetail.tax.toFixed(2)}</p><p className="text-lg font-bold">Total: ${showDetail.total.toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">New Purchase Order</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Supplier *</label><select className={selectStyle} value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} required><option value="">Select supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className={labelStyle}>Expected Date</label><input type="date" className={inputStyle} value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className={`${labelStyle} mb-0`}>Items *</label><button type="button" className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={addItem}><Plus className="h-3.5 w-3.5" /> Add Item</button></div>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select className={`${selectStyle} flex-1`} value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)} required><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <input type="number" className={`${inputStyle} w-20`} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} min="1" required />
                    <input type="number" step="0.01" className={`${inputStyle} w-28`} placeholder="Cost" value={item.unit_cost} onChange={(e) => updateItem(i, 'unit_cost', e.target.value)} required />
                    {items.length > 1 && <button type="button" className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => removeItem(i)}><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                ))}
              </div>
              <div><label className={labelStyle}>Tax</label><input type="number" step="0.01" className={inputStyle} value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
              <div><label className={labelStyle}>Notes</label><textarea className={inputStyle} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>Create PO</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
