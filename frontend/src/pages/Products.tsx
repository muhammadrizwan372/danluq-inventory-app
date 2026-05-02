import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api/client';
import { Plus, Search, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { btnStyles, inputStyle, selectStyle, labelStyle } from '../components/ui';

interface Category { id: number; name: string; description?: string; }
interface Product {
  id: number; name: string; sku: string; description?: string; category_id?: number;
  category?: Category; price: number; cost: number; stock_quantity: number; reorder_level: number; unit: string;
}

const TH = 'px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider';
const TD = 'px-4 py-3 border-b border-gray-100';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', description: '', category_id: '', price: '', cost: '', stock_quantity: '', reorder_level: '10', unit: 'pcs' });

  const fetchProducts = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (showLowStock) params.low_stock = 'true';
    api.get('/products', { params }).then((r) => { setProducts(r.data); setLoading(false); });
  };
  const fetchCategories = () => { api.get('/categories').then((r) => setCategories(r.data)); };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);
  useEffect(() => { const t = setTimeout(fetchProducts, 300); return () => clearTimeout(t); }, [search, showLowStock]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sku: '', description: '', category_id: '', price: '', cost: '', stock_quantity: '', reorder_level: '10', unit: 'pcs' });
    setShowModal(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, description: p.description || '', category_id: p.category_id?.toString() || '', price: p.price.toString(), cost: p.cost.toString(), stock_quantity: p.stock_quantity.toString(), reorder_level: p.reorder_level.toString(), unit: p.unit });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, sku: form.sku, description: form.description || null, category_id: form.category_id ? parseInt(form.category_id) : null, price: parseFloat(form.price), cost: parseFloat(form.cost), stock_quantity: parseInt(form.stock_quantity), reorder_level: parseInt(form.reorder_level), unit: form.unit };
    if (editing) await api.put(`/products/${editing.id}`, payload);
    else await api.post('/products', payload);
    setShowModal(false); fetchProducts();
  };

  const handleDelete = async (id: number) => { if (!confirm('Delete this product?')) return; await api.delete(`/products/${id}`); fetchProducts(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const lowStockCount = products.filter((p) => p.stock_quantity <= p.reorder_level).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button className={btnStyles.primary} onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</button>
      </div>

      {lowStockCount > 0 && !showLowStock && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1"><span className="text-sm font-medium text-amber-800">{lowStockCount} product{lowStockCount > 1 ? 's' : ''} at or below reorder level</span></div>
          <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => setShowLowStock(true)}>View Low Stock</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className={`${inputStyle} pl-10`} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className={showLowStock ? btnStyles.danger : `${btnStyles.secondary}`} onClick={() => setShowLowStock(!showLowStock)}>
            <AlertTriangle className="h-4 w-4" /> {showLowStock ? 'Show All' : 'Low Stock Only'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className={TH}>Product</th><th className={TH}>SKU</th><th className={TH}>Category</th><th className={TH}>Price</th><th className={TH}>Cost</th><th className={TH}>Stock</th><th className={TH}>Actions</th></tr></thead>
            <tbody>
              {products.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-400 py-8">No products found</td></tr> : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className={`${TD} font-medium`}>{p.name}</td>
                  <td className={`${TD} text-gray-500`}>{p.sku}</td>
                  <td className={TD}>{p.category?.name || '-'}</td>
                  <td className={TD}>${p.price.toFixed(2)}</td>
                  <td className={TD}>${p.cost.toFixed(2)}</td>
                  <td className={TD}><span className={p.stock_quantity <= p.reorder_level ? 'text-red-600 font-semibold' : ''}>{p.stock_quantity} {p.unit}</span></td>
                  <td className={TD}>
                    <div className="flex gap-1">
                      <button className={`${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></button>
                      <button className={`${btnStyles.danger} ${btnStyles.sm}`} onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h2 className="text-lg font-semibold">{editing ? 'Edit Product' : 'New Product'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Name *</label><input className={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className={labelStyle}>SKU *</label><input className={inputStyle} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></div>
              </div>
              <div><label className={labelStyle}>Description</label><textarea className={inputStyle} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className={labelStyle}>Category</label>
                <select className={selectStyle} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Price *</label><input type="number" step="0.01" className={inputStyle} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                <div><label className={labelStyle}>Cost *</label><input type="number" step="0.01" className={inputStyle} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelStyle}>Stock *</label><input type="number" className={inputStyle} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required /></div>
                <div><label className={labelStyle}>Reorder Level</label><input type="number" className={inputStyle} value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></div>
                <div><label className={labelStyle}>Unit</label><input className={inputStyle} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              </div>
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
