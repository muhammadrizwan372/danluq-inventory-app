import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface Employee {
  id: number; employee_id: string; full_name: string; email?: string; phone?: string;
  department: string; position: string; date_joined: string; status: string;
  base_salary: number; bank_name?: string; bank_account?: string;
  address?: string; emergency_contact?: string;
}

const departments = ['management', 'operations', 'sales', 'accounts', 'warehouse', 'logistics', 'admin'];
const emptyForm = { employee_id: '', full_name: '', email: '', phone: '', department: 'operations', position: '', date_joined: '', base_salary: '', bank_name: '', bank_account: '', address: '', emergency_contact: '' };
const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => {
    const params: Record<string, string> = {};
    if (deptFilter) params.department = deptFilter;
    api.get('/employees/', { params }).then((r) => { setEmployees(r.data); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, [deptFilter]);

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    e.position.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      employee_id: e.employee_id, full_name: e.full_name, email: e.email || '', phone: e.phone || '',
      department: e.department, position: e.position, date_joined: e.date_joined,
      base_salary: String(e.base_salary), bank_name: e.bank_name || '', bank_account: e.bank_account || '',
      address: e.address || '', emergency_contact: e.emergency_contact || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const payload = { ...form, base_salary: parseFloat(form.base_salary) };
    if (editing) await api.put(`/employees/${editing.id}`, payload);
    else await api.post('/employees/', payload);
    setShowModal(false); fetchData();
  };
  const handleDelete = async (id: number) => { if (!confirm('Delete this employee?')) return; await api.delete(`/employees/${id}`); fetchData(); };

  const activeCount = employees.filter((e) => e.status === 'active').length;
  const totalSalary = employees.filter((e) => e.status === 'active').reduce((s, e) => s + e.base_salary, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Employee</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4"><p className="text-sm text-gray-500">Total Employees</p><p className="text-2xl font-bold">{employees.length}</p></div>
        <div className="bg-white rounded-xl shadow-sm border p-4"><p className="text-sm text-gray-500">Active Employees</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></div>
        <div className="bg-white rounded-xl shadow-sm border p-4"><p className="text-sm text-gray-500">Total Monthly Salary</p><p className="text-2xl font-bold text-blue-600">₦{totalSalary.toLocaleString()}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input className={`${inputStyle} pl-10`} placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className={`${selectStyle} w-auto`} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><th className={TH}>ID</th><th className={TH}>Name</th><th className={TH}>Department</th><th className={TH}>Position</th><th className={TH}>Base Salary</th><th className={TH}>Status</th><th className={TH}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-400 py-8">No employees found</td></tr> : filtered.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-mono text-xs`}>{e.employee_id}</td>
                  <td className={`${TD} font-medium`}>{e.full_name}</td>
                  <td className={TD}><span className="capitalize">{e.department}</span></td>
                  <td className={TD}>{e.position}</td>
                  <td className={TD}>₦{e.base_salary.toLocaleString()}</td>
                  <td className={TD}><span className={getStatusBadgeClass(e.status)}>{e.status}</span></td>
                  <td className={TD}><div className="flex gap-1"><button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(e)}><Edit className="h-3.5 w-3.5" /></button><button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(e.id)}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit Employee' : 'New Employee'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Employee ID *</label><input className={inputStyle} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required disabled={!!editing} /></div>
                <div><label className={labelStyle}>Full Name *</label><input className={inputStyle} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Email</label><input type="email" className={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className={labelStyle}>Phone</label><input className={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Department *</label>
                  <select className={selectStyle} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
                    {departments.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div><label className={labelStyle}>Position *</label><input className={inputStyle} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Date Joined *</label><input type="date" className={inputStyle} value={form.date_joined} onChange={(e) => setForm({ ...form, date_joined: e.target.value })} required /></div>
                <div><label className={labelStyle}>Base Salary (₦) *</label><input type="number" className={inputStyle} value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Bank Name</label><input className={inputStyle} value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
                <div><label className={labelStyle}>Bank Account</label><input className={inputStyle} value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} /></div>
              </div>
              <div><label className={labelStyle}>Address</label><textarea className={inputStyle} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><label className={labelStyle}>Emergency Contact</label><input className={inputStyle} value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
