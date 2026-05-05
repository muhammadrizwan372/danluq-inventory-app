import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle } from '../components/ui';

interface Account { id: number; code: string; name: string; account_type: string; description?: string; parent_id?: number; is_active: boolean; balance: number; }
const emptyForm = { code: '', name: '', account_type: 'asset', description: '', parent_id: '' };
const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

const typeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  revenue: 'bg-green-100 text-green-800',
  expense: 'bg-yellow-100 text-yellow-800',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => {
    const params: Record<string, string> = { active_only: 'false' };
    if (filter) params.account_type = filter;
    api.get('/accounts/', { params }).then((r) => { setAccounts(r.data); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, [filter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (a: Account) => { setEditing(a); setForm({ code: a.code, name: a.name, account_type: a.account_type, description: a.description || '', parent_id: a.parent_id?.toString() || '' }); setShowModal(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form, parent_id: form.parent_id ? parseInt(form.parent_id) : null };
    if (editing) await api.put(`/accounts/${editing.id}`, { name: form.name, description: form.description || null, parent_id: payload.parent_id });
    else await api.post('/accounts/', payload);
    setShowModal(false); fetchData();
  };
  const handleDelete = async (id: number) => { if (!confirm('Delete this account?')) return; await api.delete(`/accounts/${id}`); fetchData(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const grouped: Record<string, Account[]> = {};
  accounts.forEach((a) => { (grouped[a.account_type] = grouped[a.account_type] || []).push(a); });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <div className="flex gap-2">
          <select className={`${selectStyle} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="asset">Assets</option><option value="liability">Liabilities</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expenses</option>
          </select>
          <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Account</button>
        </div>
      </div>

      {Object.entries(grouped).map(([type, accts]) => (
        <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">{type}s</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Code</th><th className={TH}>Name</th><th className={TH}>Type</th><th className={TH}>Balance</th><th className={TH}>Status</th><th className={TH}>Actions</th></tr></thead>
              <tbody>
                {accts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className={`${TD} font-mono font-medium`}>{a.code}</td>
                    <td className={`${TD} font-medium`}>{a.name}</td>
                    <td className={TD}><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[a.account_type] || 'bg-gray-100 text-gray-800'}`}>{a.account_type}</span></td>
                    <td className={`${TD} font-medium`}>Rs.{a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={TD}><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className={TD}><div className="flex gap-1"><button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></button><button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit Account' : 'New Account'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Code *</label><input className={inputStyle} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required disabled={!!editing} /></div>
                <div><label className={labelStyle}>Type *</label><select className={selectStyle} value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })} disabled={!!editing}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></div>
              </div>
              <div><label className={labelStyle}>Name *</label><input className={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className={labelStyle}>Description</label><textarea className={inputStyle} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
