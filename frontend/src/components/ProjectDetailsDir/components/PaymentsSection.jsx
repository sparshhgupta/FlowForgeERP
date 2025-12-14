import React from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const PaymentsSection = ({
  payments,
  canEdit,
  onAddPayment,
  fetchAllData,
  getAuthHeader,
  API_URL,
  user,
  formatCurrency
}) => {
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment record?')) return;

    try {
      await axios.delete(`${API_URL}/payments/${paymentId}`, {
        headers: getAuthHeader()
      });
      fetchAllData();
    } catch (error) {
      alert('Failed to delete payment');
    }
  };

  return (
    <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <DollarSign className="text-green-400" size={20} />
          Payments
        </h3>
        {canEdit && (
          <button
            onClick={onAddPayment}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            Add Payment
          </button>
        )}
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-900 bg-opacity-50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-slate-400">Advance Paid</p>
          <p className="text-sm font-bold text-blue-400">{formatCurrency(payments.totals.advance_paid || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Pending</p>
          <p className="text-sm font-bold text-orange-400">{formatCurrency(payments.totals.pending_amount || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Total Paid</p>
          <p className="text-sm font-bold text-green-400">{formatCurrency(payments.totals.total_paid || 0)}</p>
        </div>
      </div>

      {/* Total Project Value */}
      {payments.totals.total_project_value > 0 && (
        <div className="mb-4 p-3 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Total Project Value:</span>
            <span className="text-white font-bold">{formatCurrency(payments.totals.total_project_value || 0)}</span>
          </div>
        </div>
      )}

      {payments.payments && payments.payments.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {payments.payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-slate-900 bg-opacity-50 rounded-lg p-3 flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    payment.payment_type === 'advance' ? 'bg-blue-500 bg-opacity-20 text-blue-300' :
                    payment.payment_type === 'partial' ? 'bg-purple-500 bg-opacity-20 text-purple-300' :
                    'bg-green-500 bg-opacity-20 text-green-300'
                  }`}>
                    {payment.payment_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{payment.payment_method} • {formatDate(payment.payment_date)}</p>
                {payment.transaction_reference && (
                  <p className="text-xs text-slate-500">Ref: {payment.transaction_reference}</p>
                )}
                {payment.notes && (
                  <p className="text-xs text-slate-400 mt-1">{payment.notes}</p>
                )}
              </div>
              {user?.role === 'owner' && (
                <button
                  onClick={() => handleDeletePayment(payment.id)}
                  className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded ml-2"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-center py-4 text-sm">No payments recorded</p>
      )}
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default PaymentsSection;