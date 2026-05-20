import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { Plus, X, Download, FileText } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface Invoice { id: number; invoice_number: string; order_id: number; status: string; subtotal: number; tax: number; discount: number; total: number; notes?: string; due_date?: string; paid_date?: string; created_at: string; }
interface Order { id: number; order_number: string; total: number; }

export default function Invoices() {
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ order_id: '', notes: '', due_date: '' });

  const textP = theme === 'dark' ? 'text-text-primary-dark' : 'text-text-primary';
  const textS = theme === 'dark' ? 'text-text-secondary-dark' : 'text-text-secondary';
  const cardBg = theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-white border-gray-200';
  const thClass = `px-4 py-3 font-medium text-xs uppercase tracking-wider ${textS}`;
  const tdClass = `px-4 py-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`;

  const fetchInvoices = () => { api.get('/invoices/').then((r) => { setInvoices(r.data); setLoading(false); }); };
  useEffect(() => { fetchInvoices(); api.get('/orders/').then((r) => setOrders(r.data)); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/invoices/', { order_id: parseInt(form.order_id), notes: form.notes || null, due_date: form.due_date || null });
    setShowModal(false); fetchInvoices();
  };
  const updateStatus = async (id: number, status: string) => { await api.put(`/invoices/${id}`, { status }); fetchInvoices(); };

  const downloadPDF = async (inv: Invoice) => {
    const response = await api.get(`/invoices/${inv.id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const viewPDF = async (inv: Invoice) => {
    const response = await api.get(`/invoices/${inv.id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${textP}`}>Invoices</h1>
          <p className={`text-sm ${textS}`}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} • Download premium dark-themed PDFs</p>
        </div>
        <button className={btnStyles.primary} onClick={() => { setForm({ order_id: '', notes: '', due_date: '' }); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`border-b ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <tr>
                <th className={thClass}>Invoice #</th>
                <th className={thClass}>Order</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Due Date</th>
                <th className={thClass}>Paid</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`text-center py-8 ${textS}`}>No invoices yet</td>
                </tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className={`${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`${tdClass} font-medium ${textP}`}>{inv.invoice_number}</td>
                  <td className={`${tdClass} ${textS}`}>Order #{inv.order_id}</td>
                  <td className={tdClass}><span className={getStatusBadgeClass(inv.status)}>{inv.status}</span></td>
                  <td className={`${tdClass} font-medium ${textP}`}>Rs.{inv.total.toFixed(2)}</td>
                  <td className={`${tdClass} ${textS}`}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                  <td className={`${tdClass} ${textS}`}>{inv.paid_date ? new Date(inv.paid_date).toLocaleDateString() : '-'}</td>
                  <td className={tdClass}>
                    <div className="flex gap-1 flex-wrap">
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm"
                        onClick={() => viewPDF(inv)}
                        title="View PDF"
                      >
                        <FileText className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm"
                        onClick={() => downloadPDF(inv)}
                        title="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
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
          <div className={`rounded-xl shadow-xl w-full max-w-md ${theme === 'dark' ? 'bg-surface-dark' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${textP}`}>Create Invoice</h2>
              <button onClick={() => setShowModal(false)} className={textS}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelStyle}>Order *</label><select className={selectStyle} value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} required><option value="">Select order</option>{orders.map((o) => <option key={o.id} value={o.id}>{o.order_number} - Rs.{o.total.toFixed(2)}</option>)}</select></div>
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
