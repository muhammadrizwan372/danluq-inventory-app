import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, X } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface Invoice { id: number; invoice_number: string; order_id: number; status: string; subtotal: number; tax: number; discount: number; total: number; notes?: string; due_date?: string; paid_date?: string; created_at: string; }
interface Order { id: number; order_number: string; total: number; }

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ order_id: '', notes: '', due_date: '' });

  const fetchInvoices = () => { api.get('/invoices/').then((r) => { setInvoices(r.data); setLoading(false); }); };
  useEffect(() => { fetchInvoices(); api.get('/orders/').then((r) => setOrders(r.data)); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/invoices/', { order_id: parseInt(form.order_id), notes: form.notes || null, due_date: form.due_date || null });
    setShowModal(false); fetchInvoices();
  };
  const updateStatus = async (id: number, status: string) => { await api.put(`/invoices/${id}`, { status }); fetchInvoices(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button className={btnStyles.primary} onClick={() => { setForm({ order_id: '', notes: '', due_date: '' }); setShowModal(true); }}><Plus className="h-4 w-4" /> Create Invoice</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Invoice #</th><th className={TH}>Order</th><th className={TH}>Status</th><th className={TH}>Total</th><th className={TH}>Due Date</th><th className={TH}>Paid</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {invoices.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-400 py-8">No invoices yet</td></tr> : invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{inv.invoice_number}</td>
                  <td className={TD}>Order #{inv.order_id}</td>
                  <td className={TD}><span className={getStatusBadgeClass(inv.status)}>{inv.status}</span></td>
                  <td className={`${TD} font-medium`}>Rs.{inv.total.toFixed(2)}</td>
                  <td className={`${TD} text-gray-500`}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                  <td className={`${TD} text-gray-500`}>{inv.paid_date ? new Date(inv.paid_date).toLocaleDateString() : '-'}</td>
                  <td className={TD}>
                    <div className="flex gap-1">
                      {inv.status === 'draft' && <button className={`${btnStyles.primary} ${btnStyles.sm}`} onClick={() => updateStatus(inv.id, 'sent')}>Send</button>}
                      {['sent', 'overdue'].includes(inv.status) && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => updateStatus(inv.id, 'paid')}>Mark Paid</button>}
                      {inv.status === 'sent' && <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => updateStatus(inv.id, 'overdue')}>Overdue</button>}
                      {!['cancelled', 'paid'].includes(inv.status) && <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => updateStatus(inv.id, 'cancelled')}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">Create Invoice</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelStyle}>Order *</label><select className={selectStyle} value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} required><option value="">Select order</option>{orders.map((o) => <option key={o.id} value={o.id}>{o.order_number} - ${o.total.toFixed(2)}</option>)}</select></div>
              <div><label className={labelStyle}>Due Date</label><input type="date" className={inputStyle} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div><label className={labelStyle}>Notes</label><textarea className={inputStyle} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>Create Invoice</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
