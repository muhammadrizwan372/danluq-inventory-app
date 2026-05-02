import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle } from '../components/ui';

interface User { id: number; email: string; full_name: string; role: string; is_active: boolean; created_at: string; }
const emptyForm = { email: '', full_name: '', password: '', role: 'staff' };
const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchUsers = () => { api.get('/users/').then((r) => { setUsers(r.data); setLoading(false); }); };
  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ email: u.email, full_name: u.full_name, password: '', role: u.role }); setShowModal(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editing) { const payload: Record<string, string> = { email: form.email, full_name: form.full_name, role: form.role }; if (form.password) payload.password = form.password; await api.put(`/users/${editing.id}`, payload); }
    else await api.post('/users/', form);
    setShowModal(false); fetchUsers();
  };
  const handleDelete = async (id: number) => { if (!confirm('Delete this user?')) return; await api.delete(`/users/${id}`); fetchUsers(); };
  const toggleActive = async (u: User) => { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); fetchUsers(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add User</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Name</th><th className={TH}>Email</th><th className={TH}>Role</th><th className={TH}>Status</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{u.full_name}</td>
                  <td className={TD}>{u.email}</td>
                  <td className={TD}><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">{u.role}</span></td>
                  <td className={TD}><button onClick={() => toggleActive(u)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.is_active ? 'Active' : 'Inactive'}</button></td>
                  <td className={TD}><div className="flex gap-1"><button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(u)}><Edit className="h-3.5 w-3.5" /></button><button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(u.id)}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit User' : 'New User'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className={labelStyle}>Full Name *</label><input className={inputStyle} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div><label className={labelStyle}>Email *</label><input type="email" className={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><label className={labelStyle}>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label><input type="password" className={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} /></div>
              <div><label className={labelStyle}>Role *</label><select className={selectStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="staff">Staff</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
