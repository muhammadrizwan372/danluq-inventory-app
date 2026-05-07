import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2, X, Zap, Sun, Gauge } from 'lucide-react';
import { btnStyles, inputStyle, labelStyle } from '../components/ui';

interface Department { id?: number; log_id?: number; name: string; units: number; production?: string; details?: string; }
interface ElectricityLog {
  id: number; date: string; main_meter: number; solar: number;
  total_units: number; per_unit_price: number; total_cost: number;
  notes?: string; departments: Department[];
}

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

const DEFAULT_DEPARTMENTS = [
  { name: 'Straps Machines', units: 0, production: '', details: '' },
  { name: 'Washing', units: 0, production: '', details: '' },
  { name: 'Straps Cutter', units: 0, production: '', details: '' },
  { name: 'Colony', units: 0, production: '', details: '' },
];

export default function Electricity() {
  const [logs, setLogs] = useState<ElectricityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ElectricityLog | null>(null);
  const [viewLog, setViewLog] = useState<ElectricityLog | null>(null);
  const [form, setForm] = useState({ date: '', main_meter: '', solar: '', per_unit_price: '', notes: '' });
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS.map(d => ({ ...d })));

  const fetchLogs = () => { api.get('/electricity').then((r) => { setLogs(r.data); setLoading(false); }); };
  useEffect(() => { fetchLogs(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().split('T')[0], main_meter: '', solar: '', per_unit_price: '', notes: '' });
    setDepartments(DEFAULT_DEPARTMENTS.map(d => ({ ...d })));
    setShowModal(true);
  };

  const openEdit = (log: ElectricityLog) => {
    setEditing(log);
    setForm({ date: log.date, main_meter: log.main_meter.toString(), solar: log.solar.toString(), per_unit_price: log.per_unit_price.toString(), notes: log.notes || '' });
    setDepartments(log.departments.length > 0 ? log.departments.map(d => ({ name: d.name, units: d.units, production: d.production || '', details: d.details || '' })) : DEFAULT_DEPARTMENTS.map(d => ({ ...d })));
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date: form.date, main_meter: parseFloat(form.main_meter), solar: parseFloat(form.solar || '0'),
        per_unit_price: parseFloat(form.per_unit_price), notes: form.notes || null,
        departments: departments.filter(d => d.units > 0 || d.production || d.details).map(d => ({
          name: d.name, units: d.units, production: d.production || null, details: d.details || null,
        })),
      };
      if (editing) await api.put(`/electricity/${editing.id}`, payload);
      else await api.post('/electricity', payload);
      setShowModal(false); fetchLogs();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || 'Failed to save. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this electricity log?')) return;
    await api.delete(`/electricity/${id}`);
    fetchLogs();
  };

  const updateDept = (idx: number, field: keyof Department, value: string | number) => {
    const updated = [...departments];
    const dept = { ...updated[idx] };
    if (field === 'units') dept.units = value as number;
    else if (field === 'name') dept.name = value as string;
    else if (field === 'production') dept.production = value as string;
    else if (field === 'details') dept.details = value as string;
    updated[idx] = dept;
    setDepartments(updated);
  };

  const addDepartment = () => {
    setDepartments([...departments, { name: '', units: 0, production: '', details: '' }]);
  };

  const removeDepartment = (idx: number) => {
    setDepartments(departments.filter((_, i) => i !== idx));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const totalUnitsAll = logs.reduce((s, l) => s + l.total_units, 0);
  const totalCostAll = logs.reduce((s, l) => s + l.total_cost, 0);
  const totalSolar = logs.reduce((s, l) => s + l.solar, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Electricity Bill Tracker</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Daily Log</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="h-5 w-5 text-yellow-600" /><span className="text-sm font-medium text-yellow-800">Total Units Used</span></div>
          <p className="text-2xl font-bold text-yellow-900">{totalUnitsAll.toFixed(0)}</p>
          <p className="text-xs text-yellow-600">{logs.length} day{logs.length !== 1 ? 's' : ''} logged</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Sun className="h-5 w-5 text-green-600" /><span className="text-sm font-medium text-green-800">Solar Units</span></div>
          <p className="text-2xl font-bold text-green-900">{totalSolar.toFixed(0)}</p>
          <p className="text-xs text-green-600">from solar panels</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Gauge className="h-5 w-5 text-red-600" /><span className="text-sm font-medium text-red-800">Total Cost</span></div>
          <p className="text-2xl font-bold text-red-900">Rs.{totalCostAll.toFixed(0)}</p>
          <p className="text-xs text-red-600">electricity cost</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><th className={TH}>Date</th><th className={TH}>Main Meter</th><th className={TH}>Solar</th><th className={TH}>Total Units</th><th className={TH}>Per Unit (Rs.)</th><th className={TH}>Total Cost (Rs.)</th><th className={TH}>Departments</th><th className={TH}>Actions</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan={8} className="text-center text-gray-400 py-8">No electricity logs yet</td></tr> : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{log.date}</td>
                  <td className={TD}>{log.main_meter.toFixed(0)}</td>
                  <td className={TD}>{log.solar.toFixed(0)}</td>
                  <td className={`${TD} font-bold`}>{log.total_units.toFixed(0)}</td>
                  <td className={TD}>Rs.{log.per_unit_price.toFixed(2)}</td>
                  <td className={`${TD} font-semibold text-red-600`}>Rs.{log.total_cost.toFixed(0)}</td>
                  <td className={TD}>
                    <button className="text-blue-600 hover:underline text-xs" onClick={() => setViewLog(log)}>
                      View ({log.departments.length})
                    </button>
                  </td>
                  <td className={TD}>
                    <div className="flex gap-1">
                      <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(log)}><Edit className="h-3.5 w-3.5" /></button>
                      <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(log.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Department Detail Modal */}
      {viewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Danluq Petro Industry — {viewLog.date}</h2>
              <button onClick={() => setViewLog(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Main Meter</p>
                  <p className="text-xl font-bold">{viewLog.main_meter.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Solar</p>
                  <p className="text-xl font-bold">{viewLog.solar.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Units</p>
                  <p className="text-xl font-bold text-blue-600">{viewLog.total_units.toFixed(0)}</p>
                </div>
              </div>

              <div className="text-center bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-500">Total Cost ({viewLog.total_units.toFixed(0)} × Rs.{viewLog.per_unit_price.toFixed(2)})</p>
                <p className="text-2xl font-bold text-red-600">Rs.{viewLog.total_cost.toFixed(0)}</p>
              </div>

              <h3 className="font-semibold text-gray-700 border-b pb-2">Department Breakdown</h3>
              {viewLog.departments.length === 0 ? (
                <p className="text-gray-400 text-sm">No department data</p>
              ) : (
                <div className="space-y-3">
                  {viewLog.departments.map((dept, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{dept.name}</span>
                        <span className="font-bold text-blue-600">{dept.units} units</span>
                      </div>
                      {dept.production && <p className="text-sm text-gray-600 mt-1">Production: {dept.production}</p>}
                      {dept.details && <p className="text-sm text-gray-500 mt-1">{dept.details}</p>}
                    </div>
                  ))}
                  <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Total Department Units</span>
                    <span className="font-bold text-blue-600">{viewLog.departments.reduce((s, d) => s + d.units, 0)} units</span>
                  </div>
                </div>
              )}

              {viewLog.notes && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-yellow-600 font-medium">Notes</p>
                  <p className="text-sm text-yellow-800">{viewLog.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Electricity Log' : 'New Daily Electricity Log'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Date *</label><input type="date" className={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div><label className={labelStyle}>Per Unit Price (Rs.) *</label><input type="number" step="0.01" className={inputStyle} value={form.per_unit_price} onChange={(e) => setForm({ ...form, per_unit_price: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Main Meter (units) *</label><input type="number" step="1" className={inputStyle} value={form.main_meter} onChange={(e) => setForm({ ...form, main_meter: e.target.value })} required /></div>
                <div><label className={labelStyle}>Solar (units)</label><input type="number" step="1" className={inputStyle} value={form.solar} onChange={(e) => setForm({ ...form, solar: e.target.value })} /></div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <span className="text-sm text-blue-700">Total Units: <strong>{((parseFloat(form.main_meter) || 0) + (parseFloat(form.solar) || 0)).toFixed(0)}</strong></span>
                <span className="text-sm text-blue-700 ml-4">Total Cost: <strong>Rs.{(((parseFloat(form.main_meter) || 0) + (parseFloat(form.solar) || 0)) * (parseFloat(form.per_unit_price) || 0)).toFixed(0)}</strong></span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Department Breakdown</h3>
                  <button type="button" className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={addDepartment}><Plus className="h-3 w-3" /> Add Dept</button>
                </div>
                <div className="space-y-3">
                  {departments.map((dept, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <input className={`${inputStyle} flex-1`} placeholder="Department name" value={dept.name} onChange={(e) => updateDept(idx, 'name', e.target.value)} />
                        <input type="number" step="1" className={`${inputStyle} w-24`} placeholder="Units" value={dept.units || ''} onChange={(e) => updateDept(idx, 'units', parseFloat(e.target.value) || 0)} />
                        <button type="button" className="text-red-400 hover:text-red-600" onClick={() => removeDepartment(idx)}><X className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className={inputStyle} placeholder="Production (e.g. 6547)" value={dept.production || ''} onChange={(e) => updateDept(idx, 'production', e.target.value)} />
                        <input className={inputStyle} placeholder="Details (e.g. Green bandals 03)" value={dept.details || ''} onChange={(e) => updateDept(idx, 'details', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div><label className={labelStyle}>Notes</label><textarea className={inputStyle} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
