import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Search, Edit, Trash2, X, FileText, DollarSign, Users, CheckCircle } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle, getStatusBadgeClass } from '../components/ui';

interface Employee { id: number; employee_id: string; full_name: string; department: string; position: string; base_salary: number; }
interface PayrollRecord {
  id: number; employee_id: number; employee_name?: string; employee_code?: string;
  department?: string; position?: string; month: number; year: number;
  base_salary: number; housing_allowance: number; transport_allowance: number;
  overtime_pay: number; other_allowances: number; tax_deduction: number;
  pension_deduction: number; loan_deduction: number; advance_deduction: number;
  late_deduction: number; other_deductions: number; gross_salary: number;
  total_deductions: number; net_salary: number; status: string;
  payment_date?: string; notes?: string;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export default function Payroll() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [showModal, setShowModal] = useState(false);
  const [showSlip, setShowSlip] = useState<any>(null);
  const [editing, setEditing] = useState<PayrollRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    employee_id: '', month: String(currentMonth), year: String(currentYear),
    housing_allowance: '0', transport_allowance: '0', overtime_pay: '0', other_allowances: '0',
    tax_deduction: '0', pension_deduction: '0', loan_deduction: '0', advance_deduction: '0',
    late_deduction: '0', other_deductions: '0', notes: '',
  });

  const fetchData = () => {
    api.get('/payroll/', { params: { month: filterMonth, year: filterYear } }).then((r) => { setRecords(r.data); setLoading(false); });
  };
  const fetchEmployees = () => { api.get('/employees/').then((r) => setEmployees(r.data)); };
  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchData(); }, [filterMonth, filterYear]);

  const filtered = records.filter((r) =>
    (r.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.employee_code || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalGross = filtered.reduce((s, r) => s + r.gross_salary, 0);
  const totalNet = filtered.reduce((s, r) => s + r.net_salary, 0);
  const totalDeductions = filtered.reduce((s, r) => s + r.total_deductions, 0);
  const paidCount = filtered.filter((r) => r.status === 'paid').length;

  const openCreate = () => {
    setEditing(null);
    setForm({ employee_id: '', month: String(filterMonth), year: String(filterYear), housing_allowance: '0', transport_allowance: '0', overtime_pay: '0', other_allowances: '0', tax_deduction: '0', pension_deduction: '0', loan_deduction: '0', advance_deduction: '0', late_deduction: '0', other_deductions: '0', notes: '' });
    setShowModal(true);
  };

  const openEdit = (r: PayrollRecord) => {
    setEditing(r);
    setForm({
      employee_id: String(r.employee_id), month: String(r.month), year: String(r.year),
      housing_allowance: String(r.housing_allowance), transport_allowance: String(r.transport_allowance),
      overtime_pay: String(r.overtime_pay), other_allowances: String(r.other_allowances),
      tax_deduction: String(r.tax_deduction), pension_deduction: String(r.pension_deduction),
      loan_deduction: String(r.loan_deduction), advance_deduction: String(r.advance_deduction),
      late_deduction: String(r.late_deduction), other_deductions: String(r.other_deductions),
      notes: r.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const payload = {
      employee_id: parseInt(form.employee_id), month: parseInt(form.month), year: parseInt(form.year),
      housing_allowance: parseFloat(form.housing_allowance), transport_allowance: parseFloat(form.transport_allowance),
      overtime_pay: parseFloat(form.overtime_pay), other_allowances: parseFloat(form.other_allowances),
      tax_deduction: parseFloat(form.tax_deduction), pension_deduction: parseFloat(form.pension_deduction),
      loan_deduction: parseFloat(form.loan_deduction), advance_deduction: parseFloat(form.advance_deduction),
      late_deduction: parseFloat(form.late_deduction), other_deductions: parseFloat(form.other_deductions),
      notes: form.notes || undefined,
    };
    if (editing) await api.put(`/payroll/${editing.id}`, payload);
    else await api.post('/payroll/', payload);
    setShowModal(false); fetchData();
  };

  const handleBatchCreate = async () => {
    if (!confirm(`Generate payroll for all active employees for ${months[filterMonth - 1]} ${filterYear}?`)) return;
    await api.post('/payroll/batch', { month: filterMonth, year: filterYear });
    fetchData();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await api.put(`/payroll/${id}`, { status });
    fetchData();
  };

  const handleDelete = async (id: number) => { if (!confirm('Delete this payroll record?')) return; await api.delete(`/payroll/${id}`); fetchData(); };

  const viewSlip = async (id: number) => {
    const r = await api.get(`/payroll/${id}/slip`);
    setShowSlip(r.data);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <div className="flex gap-2">
          <button className={btnStyles.secondary} onClick={handleBatchCreate}><Users className="h-4 w-4" /> Generate All</button>
          <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Record</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Users className="h-4 w-4" />Records</div><p className="text-2xl font-bold mt-1">{filtered.length}</p></div>
        <div className="bg-white rounded-xl shadow-sm border p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><DollarSign className="h-4 w-4" />Gross Total</div><p className="text-2xl font-bold mt-1 text-blue-600">₦{totalGross.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl shadow-sm border p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><DollarSign className="h-4 w-4" />Net Total</div><p className="text-2xl font-bold mt-1 text-green-600">₦{totalNet.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl shadow-sm border p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><CheckCircle className="h-4 w-4" />Paid</div><p className="text-2xl font-bold mt-1">{paidCount}/{filtered.length}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input className={`${inputStyle} pl-10`} placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className={`${selectStyle} w-auto`} value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" className={`${inputStyle} w-24`} value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr><th className={TH}>Employee</th><th className={TH}>Department</th><th className={TH}>Base Salary</th><th className={TH}>Allowances</th><th className={TH}>Deductions</th><th className={TH}>Net Salary</th><th className={TH}>Status</th><th className={TH}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8} className="text-center text-gray-400 py-8">No payroll records found</td></tr> : filtered.map((r) => {
                const totalAllow = r.housing_allowance + r.transport_allowance + r.overtime_pay + r.other_allowances;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className={`${TD} font-medium`}><div>{r.employee_name}</div><div className="text-xs text-gray-400">{r.employee_code}</div></td>
                    <td className={TD}><span className="capitalize">{r.department}</span></td>
                    <td className={TD}>₦{r.base_salary.toLocaleString()}</td>
                    <td className={TD}>₦{totalAllow.toLocaleString()}</td>
                    <td className={TD}>₦{r.total_deductions.toLocaleString()}</td>
                    <td className={`${TD} font-semibold`}>₦{r.net_salary.toLocaleString()}</td>
                    <td className={TD}><span className={getStatusBadgeClass(r.status)}>{r.status}</span></td>
                    <td className={TD}>
                      <div className="flex gap-1">
                        <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => viewSlip(r.id)} title="View Slip"><FileText className="h-3.5 w-3.5" /></button>
                        <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(r)} title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                        {r.status === 'draft' && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => handleStatusChange(r.id, 'approved')} title="Approve"><CheckCircle className="h-3.5 w-3.5" /></button>}
                        {r.status === 'approved' && <button className={`${btnStyles.success} ${btnStyles.sm}`} onClick={() => handleStatusChange(r.id, 'paid')} title="Mark Paid"><DollarSign className="h-3.5 w-3.5" /></button>}
                        {r.status !== 'paid' && <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="p-4 border-t bg-gray-50 text-sm font-medium flex justify-between">
            <span>Total Deductions: ₦{totalDeductions.toLocaleString()}</span>
            <span>Total Net Pay: ₦{totalNet.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit Payroll Record' : 'New Payroll Record'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editing && (
                <div className="grid grid-cols-3 gap-4">
                  <div><label className={labelStyle}>Employee *</label>
                    <select className={selectStyle} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required>
                      <option value="">Select...</option>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                    </select>
                  </div>
                  <div><label className={labelStyle}>Month *</label>
                    <select className={selectStyle} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required>
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div><label className={labelStyle}>Year *</label><input type="number" className={inputStyle} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required /></div>
                </div>
              )}
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Allowances</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Housing Allowance</label><input type="number" step="0.01" className={inputStyle} value={form.housing_allowance} onChange={(e) => setForm({ ...form, housing_allowance: e.target.value })} /></div>
                <div><label className={labelStyle}>Transport Allowance</label><input type="number" step="0.01" className={inputStyle} value={form.transport_allowance} onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })} /></div>
                <div><label className={labelStyle}>Overtime Pay</label><input type="number" step="0.01" className={inputStyle} value={form.overtime_pay} onChange={(e) => setForm({ ...form, overtime_pay: e.target.value })} /></div>
                <div><label className={labelStyle}>Other Allowances</label><input type="number" step="0.01" className={inputStyle} value={form.other_allowances} onChange={(e) => setForm({ ...form, other_allowances: e.target.value })} /></div>
              </div>
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Deductions</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Tax</label><input type="number" step="0.01" className={inputStyle} value={form.tax_deduction} onChange={(e) => setForm({ ...form, tax_deduction: e.target.value })} /></div>
                <div><label className={labelStyle}>Pension</label><input type="number" step="0.01" className={inputStyle} value={form.pension_deduction} onChange={(e) => setForm({ ...form, pension_deduction: e.target.value })} /></div>
                <div><label className={labelStyle}>Loan</label><input type="number" step="0.01" className={inputStyle} value={form.loan_deduction} onChange={(e) => setForm({ ...form, loan_deduction: e.target.value })} /></div>
                <div><label className={labelStyle}>Advance</label><input type="number" step="0.01" className={inputStyle} value={form.advance_deduction} onChange={(e) => setForm({ ...form, advance_deduction: e.target.value })} /></div>
                <div><label className={labelStyle}>Late Penalty</label><input type="number" step="0.01" className={inputStyle} value={form.late_deduction} onChange={(e) => setForm({ ...form, late_deduction: e.target.value })} /></div>
                <div><label className={labelStyle}>Other</label><input type="number" step="0.01" className={inputStyle} value={form.other_deductions} onChange={(e) => setForm({ ...form, other_deductions: e.target.value })} /></div>
              </div>
              <div><label className={labelStyle}>Notes</label><textarea className={inputStyle} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" className={btnStyles.secondary} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className={btnStyles.primary}>{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Modal */}
      {showSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">Salary Slip</h2><button onClick={() => setShowSlip(null)}><X className="h-5 w-5" /></button></div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b pb-3">
                <h3 className="text-lg font-bold text-blue-700">{showSlip.company}</h3>
                <p className="text-sm text-gray-500">Pay Slip — {showSlip.period}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Employee ID:</span> {showSlip.employee.id}</div>
                <div><span className="text-gray-500">Name:</span> {showSlip.employee.name}</div>
                <div><span className="text-gray-500">Department:</span> <span className="capitalize">{showSlip.employee.department}</span></div>
                <div><span className="text-gray-500">Position:</span> {showSlip.employee.position}</div>
                {showSlip.employee.bank_name && <div><span className="text-gray-500">Bank:</span> {showSlip.employee.bank_name}</div>}
                {showSlip.employee.bank_account && <div><span className="text-gray-500">Account:</span> {showSlip.employee.bank_account}</div>}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2">Earnings</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Base Salary</span><span>₦{showSlip.earnings.base_salary.toLocaleString()}</span></div>
                  {showSlip.earnings.housing_allowance > 0 && <div className="flex justify-between"><span>Housing Allowance</span><span>₦{showSlip.earnings.housing_allowance.toLocaleString()}</span></div>}
                  {showSlip.earnings.transport_allowance > 0 && <div className="flex justify-between"><span>Transport Allowance</span><span>₦{showSlip.earnings.transport_allowance.toLocaleString()}</span></div>}
                  {showSlip.earnings.overtime_pay > 0 && <div className="flex justify-between"><span>Overtime Pay</span><span>₦{showSlip.earnings.overtime_pay.toLocaleString()}</span></div>}
                  {showSlip.earnings.other_allowances > 0 && <div className="flex justify-between"><span>Other Allowances</span><span>₦{showSlip.earnings.other_allowances.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Gross Salary</span><span>₦{showSlip.gross_salary.toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2">Deductions</h4>
                <div className="space-y-1 text-sm">
                  {showSlip.deductions.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>₦{showSlip.deductions.tax.toLocaleString()}</span></div>}
                  {showSlip.deductions.pension > 0 && <div className="flex justify-between"><span>Pension</span><span>₦{showSlip.deductions.pension.toLocaleString()}</span></div>}
                  {showSlip.deductions.loan > 0 && <div className="flex justify-between"><span>Loan Repayment</span><span>₦{showSlip.deductions.loan.toLocaleString()}</span></div>}
                  {showSlip.deductions.advance > 0 && <div className="flex justify-between"><span>Advance</span><span>₦{showSlip.deductions.advance.toLocaleString()}</span></div>}
                  {showSlip.deductions.late > 0 && <div className="flex justify-between"><span>Late Penalty</span><span>₦{showSlip.deductions.late.toLocaleString()}</span></div>}
                  {showSlip.deductions.other > 0 && <div className="flex justify-between"><span>Other</span><span>₦{showSlip.deductions.other.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Total Deductions</span><span>₦{showSlip.total_deductions.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                <span className="font-semibold text-blue-800">Net Salary</span>
                <span className="text-xl font-bold text-blue-700">₦{showSlip.net_salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Status: <span className="capitalize">{showSlip.status}</span></span>
                {showSlip.payment_date && <span>Paid: {new Date(showSlip.payment_date).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
