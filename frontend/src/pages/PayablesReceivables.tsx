import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, X, DollarSign } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface PR { id: number; type: string; party_name: string; description: string; total_amount: number; paid_amount: number; balance: number; due_date?: string; status: string; supplier_id?: number; customer_id?: number; }
interface Supplier { id: number; name: string; }
interface Customer { id: number; name: string; }

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function PayablesReceivables() {
  const [records, setRecords] = useState<PR[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState<PR | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [tab, setTab] = useState<'payable' | 'receivable'>('payable');
  const [form, setForm] = useState({ type: 'payable', party_id: '', description: '', total_amount: '', due_date: '' });

  const fetchData = () => { api.get('/payables-receivables/', { params: { type: tab } }).then((r) => { setRecords(r.data); setLoading(false); }); };
  useEffect(() => { fetchData(); api.get('/suppliers/').then((r) => setSuppliers(r.data)); api.get('/customers/').then((r) => setCustomers(r.data)); }, []);
  useEffect(() => { fetchData(); }, [tab]);

  const openCreate = () => { setForm({ type: tab, party_id: '', description: '', total_amount: '', due_date: '' }); setShowModal(true); };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const selectedId = parseInt(form.party_id);
    const isPayable = form.type === 'payable';
    const party = isPayable ? suppliers.find((s) => s.id === selectedId) : customers.find((c) => c.id === selectedId);
    const payload: Record<string, unknown> = {
      type: form.type,
      party_name: party?.name || '',
      description: form.description,
      total_amount: parseFloat(form.total_amount),
      due_date: form.due_date || null,
    };
    if (isPayable) payload.supplier_id = selectedId; else payload.customer_id = selectedId;
    await api.post('/payables-receivables/', payload);
    setShowModal(false); fetchData();
  };
  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    if (!payModal) return;
    const newPaid = payModal.paid_amount + parseFloat(payAmount);
    await api.put(`/payables-receivables/${payModal.id}`, { paid_amount: newPaid });
    setPayModal(null); setPayAmount(''); fetchData();
  };

  const totalAmount = records.reduce((s, r) => s + r.total_amount, 0);
  const totalPaid = records.reduce((s, r) => s + r.paid_amount, 0);
  const totalBalance = records.reduce((s, r) => s + r.balance, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payables & Receivables</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> New Record</button>
      </div>

      <div className="flex gap-2 mb-6">
        <button className={tab === 'payable' ? btnStyles.primary : btnStyles.secondary} onClick={() => setTab('payable')}>Accounts Payable</button>
        <button className={tab === 'receivable' ? btnStyles.primary : btnStyles.secondary} onClick={() => setTab('receivable')}>Accounts Receivable</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Paid</p><p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Outstanding</p><p className="text-2xl font-bold text-red-600">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><th className={TH}>{tab === 'payable' ? 'Supplier' : 'Customer'}</th><th className={TH}>Description</th><th className={TH}>Total</th><th className={TH}>Paid</th><th className={TH}>Balance</th><th className={TH}>Due Date</th><th className={TH}>Status</th><th className={TH}>Actions</th></tr>
            </thead>
            <tbody>
              {records.length === 0 ? <tr><td colSpan={8} className="text-center text-gray-400 py-8">No records found</td></tr> : records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{r.party_name || '-'}</td>
                  <td className={TD}>{r.description}</td>
                  <td className={`${TD} font-medium`}>${r.total_amount.toFixed(2)}</td>
                  <td className={`${TD} text-green-600`}>${r.paid_amount.toFixed(2)}</td>
                  <td className={`${TD} text-red-600 font-medium`}>${r.balance.toFixed(2)}</td>
                  <td className={`${TD} text-gray-500`}>{r.due_date ? new Date(r.due_date).toLocaleDateString() : '-'}</td>
                  <td className={TD}><span className={getStatusBadgeClass(r.status)}>{r.status}</span></td>
                  <td className={TD}>
                    {r.status !== 'paid' && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => { setPayModal(r); setPayAmount(''); }}><DollarSign className="h-3.5 w-3.5" /> Pay</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">New {tab === 'payable' ? 'Payable' : 'Receivable'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelStyle}>{tab === 'payable' ? 'Supplier' : 'Customer'} *</label>
                <select className={selectStyle} value={form.party_id} onChange={(e) => setForm({ ...form, party_id: e.target.value })} required>
                  <option value="">Select...</option>
                  {tab === 'payable' ? suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className={labelStyle}>Description *</label><input className={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Amount *</label><input type="number" step="0.01" className={inputStyle} value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required /></div>
                <div><label className={labelStyle}>Due Date</label><input type="date" className={inputStyle} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>Create</button></div>
            </form>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">Record Payment</h2><button onClick={() => setPayModal(null)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Outstanding: <span className="font-semibold text-red-600">${payModal.balance.toFixed(2)}</span></p>
              <div><label className={labelStyle}>Payment Amount *</label><input type="number" step="0.01" max={payModal.balance} className={inputStyle} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setPayModal(null)}>Cancel</button><button type="submit" className={btnStyles.primary}>Submit Payment</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
