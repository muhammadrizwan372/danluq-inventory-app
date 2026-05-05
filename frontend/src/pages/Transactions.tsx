import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Eye, X, Trash2 } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface JournalEntry { id: number; account_id: number; debit: number; credit: number; description?: string; account_name?: string; }
interface Transaction { id: number; reference: string; date: string; description: string; status: string; entries: JournalEntry[]; created_at: string; }
interface Account { id: number; code: string; name: string; account_type: string; }

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Transaction | null>(null);
  const [form, setForm] = useState({ description: '', date: '' });
  const [entries, setEntries] = useState<{ account_id: string; debit: string; credit: string; description: string }[]>([]);

  const fetchData = () => { api.get('/transactions/').then((r) => { setTransactions(r.data); setLoading(false); }); };
  useEffect(() => { fetchData(); api.get('/accounts/').then((r) => setAccounts(r.data)); }, []);

  const openCreate = () => {
    setForm({ description: '', date: '' });
    setEntries([{ account_id: '', debit: '', credit: '0', description: '' }, { account_id: '', debit: '0', credit: '', description: '' }]);
    setShowModal(true);
  };
  const addEntry = () => setEntries([...entries, { account_id: '', debit: '0', credit: '0', description: '' }]);
  const removeEntry = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: string, value: string) => { const n = [...entries]; (n[i] as any)[field] = value; setEntries(n); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/transactions/', {
      description: form.description,
      date: form.date || null,
      entries: entries.map((en) => ({ account_id: parseInt(en.account_id), debit: parseFloat(en.debit) || 0, credit: parseFloat(en.credit) || 0, description: en.description || null })),
    });
    setShowModal(false); fetchData();
  };

  const postTransaction = async (id: number) => { await api.put(`/transactions/${id}`, { status: 'posted' }); fetchData(); };
  const deleteTransaction = async (id: number) => { if (!confirm('Delete this transaction?')) return; await api.delete(`/transactions/${id}`); fetchData(); };

  const totalDebits = entries.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0);
  const totalCredits = entries.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0);
  const balanced = Math.abs(totalDebits - totalCredits) < 0.01;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> New Entry</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Reference</th><th className={TH}>Date</th><th className={TH}>Description</th><th className={TH}>Status</th><th className={TH}>Entries</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {transactions.length === 0 ? <tr><td colSpan={6} className="text-center text-gray-400 py-8">No journal entries yet</td></tr> : transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-mono font-medium`}>{t.reference}</td>
                  <td className={`${TD} text-gray-500`}>{new Date(t.date).toLocaleDateString()}</td>
                  <td className={TD}>{t.description}</td>
                  <td className={TD}><span className={getStatusBadgeClass(t.status)}>{t.status}</span></td>
                  <td className={TD}>{t.entries.length} lines</td>
                  <td className={TD}>
                    <div className="flex gap-1">
                      <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => setShowDetail(t)}><Eye className="h-3.5 w-3.5" /></button>
                      {t.status === 'draft' && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => postTransaction(t.id)}>Post</button>}
                      {t.status === 'draft' && <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => deleteTransaction(t.id)}><Trash2 className="h-3.5 w-3.5" /></button>}
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
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{showDetail.reference}</h2><button onClick={() => setShowDetail(null)}><X className="h-5 w-5" /></button></div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><span className="text-sm text-gray-500">Description:</span><p className="font-medium">{showDetail.description}</p></div>
                <div><span className="text-sm text-gray-500">Status:</span><p><span className={getStatusBadgeClass(showDetail.status)}>{showDetail.status}</span></p></div>
              </div>
              <table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className={TH}>Account</th><th className={TH}>Debit</th><th className={TH}>Credit</th><th className={TH}>Note</th></tr></thead>
                <tbody>
                  {showDetail.entries.map((e) => (<tr key={e.id}><td className={`${TD} font-medium`}>{e.account_name}</td><td className={TD}>{e.debit > 0 ? `Rs.${e.debit.toFixed(2)}` : '-'}</td><td className={TD}>{e.credit > 0 ? `Rs.${e.credit.toFixed(2)}` : '-'}</td><td className={`${TD} text-gray-500`}>{e.description || '-'}</td></tr>))}
                  <tr className="bg-gray-50 font-semibold"><td className={TD}>Total</td><td className={TD}>Rs.{showDetail.entries.reduce((s, e) => s + e.debit, 0).toFixed(2)}</td><td className={TD}>Rs.{showDetail.entries.reduce((s, e) => s + e.credit, 0).toFixed(2)}</td><td className={TD}></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">New Journal Entry</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Description *</label><input className={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
                <div><label className={labelStyle}>Date</label><input type="date" className={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className={`${labelStyle} mb-0`}>Line Items *</label><button type="button" className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={addEntry}><Plus className="h-3.5 w-3.5" /> Add Line</button></div>
                <div className="space-y-2">
                  {entries.map((en, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <select className={`${selectStyle} flex-1`} value={en.account_id} onChange={(e) => updateEntry(i, 'account_id', e.target.value)} required><option value="">Select account</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select>
                      <input type="number" step="0.01" className={`${inputStyle} w-28`} placeholder="Debit" value={en.debit} onChange={(e) => updateEntry(i, 'debit', e.target.value)} />
                      <input type="number" step="0.01" className={`${inputStyle} w-28`} placeholder="Credit" value={en.credit} onChange={(e) => updateEntry(i, 'credit', e.target.value)} />
                      <input className={`${inputStyle} w-32`} placeholder="Note" value={en.description} onChange={(e) => updateEntry(i, 'description', e.target.value)} />
                      {entries.length > 2 && <button type="button" className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => removeEntry(i)}><Trash2 className="h-3.5 w-3.5" /></button>}
                    </div>
                  ))}
                </div>
                <div className={`mt-2 text-sm font-medium ${balanced ? 'text-green-600' : 'text-red-600'}`}>
                  Debits: Rs.{totalDebits.toFixed(2)} | Credits: Rs.{totalCredits.toFixed(2)} | {balanced ? 'Balanced' : 'Not balanced'}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary} disabled={!balanced}>Create Entry</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
