import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle } from '../components/ui';

interface Expense { id: number; date: string; category: string; description: string; amount: number; reference?: string; account_id?: number; supplier_id?: number; is_paid: boolean; paid_date?: string; supplier_name?: string; account_name?: string; }
interface Supplier { id: number; name: string; }
interface Account { id: number; code: string; name: string; }

const categories = ['utilities', 'rent', 'salaries', 'transport', 'supplies', 'maintenance', 'insurance', 'marketing', 'other'];
const emptyForm = { category: 'other', description: '', amount: '', reference: '', account_id: '', supplier_id: '', is_paid: false as boolean, date: '' };
const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCat, setFilterCat] = useState('');

  const fetchData = () => {
    const params: Record<string, string> = {};
    if (filterCat) params.category = filterCat;
    api.get('/expenses/', { params }).then((r) => { setExpenses(r.data); setLoading(false); });
  };
  useEffect(() => { fetchData(); api.get('/suppliers/').then((r) => setSuppliers(r.data)); api.get('/accounts/', { params: { account_type: 'expense' } }).then((r) => setAccounts(r.data)); }, []);
  useEffect(() => { fetchData(); }, [filterCat]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (exp: Expense) => { setEditing(exp); setForm({ category: exp.category, description: exp.description, amount: exp.amount.toString(), reference: exp.reference || '', account_id: exp.account_id?.toString() || '', supplier_id: exp.supplier_id?.toString() || '', is_paid: exp.is_paid, date: exp.date ? exp.date.split('T')[0] : '' }); setShowModal(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount), account_id: form.account_id ? parseInt(form.account_id) : null, supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null, date: form.date || null, reference: form.reference || null };
    if (editing) await api.put(`/expenses/${editing.id}`, payload);
    else await api.post('/expenses/', payload);
    setShowModal(false); fetchData();
  };
  const handleDelete = async (id: number) => { if (!confirm('Delete this expense?')) return; await api.delete(`/expenses/${id}`); fetchData(); };
  const markPaid = async (id: number) => { await api.put(`/expenses/${id}`, { is_paid: true }); fetchData(); };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = expenses.filter((e) => e.is_paid).reduce((s, e) => s + e.amount, 0);
  const totalUnpaid = totalExpenses - totalPaid;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Expense</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-gray-900">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Paid</p><p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Unpaid</p><p className="text-2xl font-bold text-red-600">${totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <select className={`${selectStyle} w-auto`} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Date</th><th className={TH}>Category</th><th className={TH}>Description</th><th className={TH}>Amount</th><th className={TH}>Supplier</th><th className={TH}>Status</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {expenses.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-400 py-8">No expenses recorded</td></tr> : expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className={`${TD} text-gray-500`}>{new Date(exp.date).toLocaleDateString()}</td>
                  <td className={TD}><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">{exp.category}</span></td>
                  <td className={TD}>{exp.description}</td>
                  <td className={`${TD} font-medium`}>${exp.amount.toFixed(2)}</td>
                  <td className={TD}>{exp.supplier_name || '-'}</td>
                  <td className={TD}>
                    {exp.is_paid
                      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
                      : <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => markPaid(exp.id)}>Mark Paid</button>
                    }
                  </td>
                  <td className={TD}><div className="flex gap-1"><button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(exp)}><Edit className="h-3.5 w-3.5" /></button><button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(exp.id)}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit Expense' : 'New Expense'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Category *</label><select className={selectStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></div>
                <div><label className={labelStyle}>Date</label><input type="date" className={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              </div>
              <div><label className={labelStyle}>Description *</label><input className={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Amount *</label><input type="number" step="0.01" className={inputStyle} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div><label className={labelStyle}>Reference</label><input className={inputStyle} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Supplier</label><select className={selectStyle} value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}><option value="">None</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className={labelStyle}>Account</label><select className={selectStyle} value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}><option value="">None</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select></div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="is_paid" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} /><label htmlFor="is_paid" className="text-sm text-gray-700">Already paid</label></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
