import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const PaymentModal = ({ isOpen, onClose, id, getAuthHeader, API_URL, fetchAllData }) => {
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'advance',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_reference: '',
    notes: ''
  });

  const handleAddPayment = async () => {
    try {
      await axios.post(
        `${API_URL}/payments`,
        { ...paymentForm, project_id: id },
        { headers: getAuthHeader() }
      );
      onClose();
      setPaymentForm({
        amount: '',
        payment_type: 'advance',
        payment_method: 'Bank Transfer',
        payment_date: new Date().toISOString().split('T')[0],
        transaction_reference: '',
        notes: ''
      });
      fetchAllData();
    } catch (error) {
      alert('Failed to add payment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Add Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-slate-300 mb-2 text-sm">Amount *</label>
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., 500000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2 text-sm">Type *</label>
              <select
                value={paymentForm.payment_type}
                onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="advance">Advance</option>
                <option value="partial">Partial</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-2 text-sm">Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm">Date *</label>
            <input
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm">Transaction Reference</label>
            <input
              type="text"
              value={paymentForm.transaction_reference}
              onChange={(e) => setPaymentForm({...paymentForm, transaction_reference: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., TXN123456"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm">Notes</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
              rows="2"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAddPayment}
            disabled={!paymentForm.amount}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg"
          >
            Add Payment
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;