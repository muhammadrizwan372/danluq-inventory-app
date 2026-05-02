import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package } from 'lucide-react';
import { btnStyles, inputStyle, labelStyle } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Danluq Petro Industries</h1>
            <p className="text-gray-500 mt-1">Business Management System</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelStyle}>Email</label>
              <input type="email" className={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
            </div>
            <div>
              <label className={labelStyle}>Password</label>
              <input type="password" className={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            <button type="submit" className={`${btnStyles.primary} w-full`} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-medium mb-1">Demo credentials:</p>
            <p>Email: admin@example.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
