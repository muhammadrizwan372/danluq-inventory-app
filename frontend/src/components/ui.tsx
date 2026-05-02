const btnBase = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

export const btnStyles = {
  primary: `${btnBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`,
  secondary: `${btnBase} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500`,
  danger: `${btnBase} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`,
  success: `${btnBase} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`,
  sm: 'px-3 py-1.5 text-xs',
};

export const inputStyle = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors';
export const selectStyle = `${inputStyle} appearance-none bg-white`;
export const labelStyle = 'block text-sm font-medium text-gray-700 mb-1';

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    sent: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    draft: 'bg-purple-100 text-purple-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    received: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    posted: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
    cancelled: 'bg-red-100 text-red-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`;
}
