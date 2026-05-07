import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2, X, Sun, Moon, Calendar } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle } from '../components/ui';

interface Product { id: number; name: string; sku: string; }
interface ProductionRecord {
  id: number; date: string; shift: string; product_id: number;
  quantity_kg: number; waste_kg: number; notes?: string; operator?: string;
  product?: Product;
}
interface DailySummary {
  date: string; day_total_kg: number; night_total_kg: number; total_kg: number;
  day_waste_kg: number; night_waste_kg: number; total_waste_kg: number;
  day_records: number; night_records: number;
}

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Production() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductionRecord | null>(null);
  const [view, setView] = useState<'records' | 'summary'>('records');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [shiftFilter, setShiftFilter] = useState('');
  const [form, setForm] = useState({ date: '', shift: 'day', product_id: '', quantity_kg: '', waste_kg: '0', notes: '', operator: '' });

  const fetchRecords = () => {
    const params: Record<string, string> = {};
    if (dateFilter) params.date = dateFilter;
    if (shiftFilter) params.shift = shiftFilter;
    api.get('/production', { params }).then((r) => { setRecords(r.data); setLoading(false); });
  };
  const fetchSummary = () => { api.get('/production/summary').then((r) => setSummary(r.data)); };
  const fetchProducts = () => { api.get('/products').then((r) => setProducts(r.data)); };

  useEffect(() => { fetchRecords(); fetchSummary(); fetchProducts(); }, []);
  useEffect(() => { fetchRecords(); }, [dateFilter, shiftFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ date: dateFilter || new Date().toISOString().split('T')[0], shift: 'day', product_id: '', quantity_kg: '', waste_kg: '0', notes: '', operator: '' });
    setShowModal(true);
  };
  const openEdit = (r: ProductionRecord) => {
    setEditing(r);
    setForm({ date: r.date, shift: r.shift, product_id: r.product_id.toString(), quantity_kg: r.quantity_kg.toString(), waste_kg: r.waste_kg.toString(), notes: r.notes || '', operator: r.operator || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { date: form.date, shift: form.shift, product_id: parseInt(form.product_id), quantity_kg: parseFloat(form.quantity_kg), waste_kg: parseFloat(form.waste_kg || '0'), notes: form.notes || null, operator: form.operator || null };
      if (editing) await api.put(`/production/${editing.id}`, payload);
      else await api.post('/production', payload);
      setShowModal(false); fetchRecords(); fetchSummary();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || 'Failed to save record. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this production record?')) return;
    await api.delete(`/production/${id}`);
    fetchRecords(); fetchSummary();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const dayRecords = records.filter(r => r.shift === 'day');
  const nightRecords = records.filter(r => r.shift === 'night');
  const dayTotal = dayRecords.reduce((s, r) => s + r.quantity_kg, 0);
  const nightTotal = nightRecords.reduce((s, r) => s + r.quantity_kg, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Production Report</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Record</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Sun className="h-5 w-5 text-amber-600" /><span className="text-sm font-medium text-amber-800">Day Shift (7AM - 7PM)</span></div>
          <p className="text-2xl font-bold text-amber-900">{dayTotal.toFixed(1)} kg</p>
          <p className="text-xs text-amber-600">{dayRecords.length} record{dayRecords.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Moon className="h-5 w-5 text-indigo-600" /><span className="text-sm font-medium text-indigo-800">Night Shift (7PM - 7AM)</span></div>
          <p className="text-2xl font-bold text-indigo-900">{nightTotal.toFixed(1)} kg</p>
          <p className="text-xs text-indigo-600">{nightRecords.length} record{nightRecords.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="h-5 w-5 text-green-600" /><span className="text-sm font-medium text-green-800">Total Production</span></div>
          <p className="text-2xl font-bold text-green-900">{(dayTotal + nightTotal).toFixed(1)} kg</p>
          <p className="text-xs text-green-600">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex gap-2">
            <button className={view === 'records' ? btnStyles.primary : btnStyles.secondary} onClick={() => setView('records')}>Records</button>
            <button className={view === 'summary' ? btnStyles.primary : btnStyles.secondary} onClick={() => setView('summary')}>Daily Summary</button>
          </div>
          {view === 'records' && (
            <div className="flex gap-3 ml-auto">
              <input type="date" className={inputStyle} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              <select className={selectStyle} value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
                <option value="">All Shifts</option>
                <option value="day">Day Shift</option>
                <option value="night">Night Shift</option>
              </select>
            </div>
          )}
        </div>

        {view === 'records' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr><th className={TH}>Date</th><th className={TH}>Shift</th><th className={TH}>Product</th><th className={TH}>Quantity (kg)</th><th className={TH}>Waste (kg)</th><th className={TH}>Operator</th><th className={TH}>Notes</th><th className={TH}>Actions</th></tr>
              </thead>
              <tbody>
                {records.length === 0 ? <tr><td colSpan={8} className="text-center text-gray-400 py-8">No production records for this date</td></tr> : records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className={TD}>{r.date}</td>
                    <td className={TD}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${r.shift === 'day' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {r.shift === 'day' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                        {r.shift === 'day' ? 'Day' : 'Night'}
                      </span>
                    </td>
                    <td className={`${TD} font-medium`}>{r.product?.name || '-'}</td>
                    <td className={`${TD} font-semibold`}>{r.quantity_kg.toFixed(1)}</td>
                    <td className={TD}>{r.waste_kg.toFixed(1)}</td>
                    <td className={TD}>{r.operator || '-'}</td>
                    <td className={`${TD} text-gray-500 max-w-[150px] truncate`}>{r.notes || '-'}</td>
                    <td className={TD}>
                      <div className="flex gap-1">
                        <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(r)}><Edit className="h-3.5 w-3.5" /></button>
                        <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr><th className={TH}>Date</th><th className={TH}>Day Production (kg)</th><th className={TH}>Night Production (kg)</th><th className={TH}>Total (kg)</th><th className={TH}>Day Waste (kg)</th><th className={TH}>Night Waste (kg)</th><th className={TH}>Total Waste (kg)</th></tr>
              </thead>
              <tbody>
                {summary.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-400 py-8">No production data yet</td></tr> : summary.map((s) => (
                  <tr key={s.date} className="hover:bg-gray-50">
                    <td className={`${TD} font-medium`}>{s.date}</td>
                    <td className={TD}><span className="inline-flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-amber-500" />{s.day_total_kg.toFixed(1)}</span></td>
                    <td className={TD}><span className="inline-flex items-center gap-1"><Moon className="h-3.5 w-3.5 text-indigo-500" />{s.night_total_kg.toFixed(1)}</span></td>
                    <td className={`${TD} font-bold`}>{s.total_kg.toFixed(1)}</td>
                    <td className={`${TD} text-red-500`}>{s.day_waste_kg.toFixed(1)}</td>
                    <td className={`${TD} text-red-500`}>{s.night_waste_kg.toFixed(1)}</td>
                    <td className={`${TD} text-red-600 font-medium`}>{s.total_waste_kg.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit Record' : 'New Production Record'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Date *</label><input type="date" className={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div><label className={labelStyle}>Shift *</label>
                  <select className={selectStyle} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} required>
                    <option value="day">Day Shift (7AM - 7PM)</option>
                    <option value="night">Night Shift (7PM - 7AM)</option>
                  </select>
                </div>
              </div>
              <div><label className={labelStyle}>Product *</label>
                <select className={selectStyle} value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Quantity Produced (kg) *</label><input type="number" step="0.1" className={inputStyle} value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })} required /></div>
                <div><label className={labelStyle}>Waste (kg)</label><input type="number" step="0.1" className={inputStyle} value={form.waste_kg} onChange={(e) => setForm({ ...form, waste_kg: e.target.value })} /></div>
              </div>
              <div><label className={labelStyle}>Operator</label><input className={inputStyle} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} placeholder="Operator name" /></div>
              <div><label className={labelStyle}>Notes</label><textarea className={inputStyle} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this production run" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
