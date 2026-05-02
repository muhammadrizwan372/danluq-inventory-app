import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { btnStyles, inputStyle, labelStyle } from '../components/ui';

interface Customer { id: number; name: string; email?: string; phone?: string; address?: string; city?: string; country?: string; notes?: string; }
const emptyForm = { name: '', email: '', phone: '', address: '', city: '', country: '', notes: '' };
const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => { const params: Record<string, string> = {}; if (search) params.search = search; api.get('/customers/', { params }).then((r) => { setCustomers(r.data); setLoading(false); }); };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => { const t = setTimeout(fetchData, 300); return () => clearTimeout(t); }, [search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', city: c.city || '', country: c.country || '', notes: c.notes || '' }); setShowModal(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editing) await api.put(`/customers/${editing.id}`, form);
    else await api.post('/customers/', form);
    setShowModal(false); fetchData();
  };
  const handleDelete = async (id: number) => { if (!confirm('Delete this customer?')) return; await api.delete(`/customers/${id}`); fetchData(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Customer</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input className={`${inputStyle} pl-10`} placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Name</th><th className={TH}>Email</th><th className={TH}>Phone</th><th className={TH}>City</th><th className={TH}>Country</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {customers.length === 0 ? <tr><td colSpan={6} className="text-center text-gray-400 py-8">No customers found</td></tr> : customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{c.name}</td><td className={TD}>{c.email || '-'}</td><td className={TD}>{c.phone || '-'}</td><td className={TD}>{c.city || '-'}</td><td className={TD}>{c.country || '-'}</td>
                  <td className={TD}><div className="flex gap-1"><button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></button><button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit Customer' : 'New Customer'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelStyle}>Name *</label><input className={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Email</label><input type="email" className={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className={labelStyle}>Phone</label><input className={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><label className={labelStyle}>Address</label><textarea className={inputStyle} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>City</label><input className={inputStyle} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><label className={labelStyle}>Country</label><input className={inputStyle} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              </div>
              <div><label className={labelStyle}>Notes</label><textarea className={inputStyle} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
