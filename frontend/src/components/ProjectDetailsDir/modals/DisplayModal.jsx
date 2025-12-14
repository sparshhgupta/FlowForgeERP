import React from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const DisplayModal = ({ 
  isOpen, 
  onClose, 
  selectedProduction, 
  displayForm, 
  setDisplayForm, 
  onUpdate,
  onReset,
  getAuthHeader,
  API_URL
}) => {
  if (!isOpen || !selectedProduction) return null;

  const handleReset = async () => {
    try {
      await axios.put(
        `${API_URL}/products/production/${selectedProduction.id}/display`,
        {
          display_quantity_produced: null,
          display_target_quantity: null
        },
        { headers: getAuthHeader() }
      );
      onReset();
    } catch (error) {
      alert('Failed to reset display values');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Configure Client Display</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-slate-300 mb-2">Product: <span className="font-semibold">{selectedProduction.product_name}</span></p>
          <p className="text-slate-400 text-sm mb-4">Set different values to show to the client. Leave empty to use actual values.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2 text-sm">Display Quantity</label>
              <input
                type="number"
                value={displayForm.displayQuantity}
                onChange={(e) => setDisplayForm({...displayForm, displayQuantity: e.target.value})}
                placeholder={selectedProduction.quantity_produced}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
              <p className="text-slate-500 text-xs mt-1">
                Actual: {selectedProduction.quantity_produced}
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-2 text-sm">Display Target</label>
              <input
                type="number"
                value={displayForm.displayTarget}
                onChange={(e) => setDisplayForm({...displayForm, displayTarget: e.target.value})}
                placeholder={selectedProduction.target_quantity}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
              <p className="text-slate-500 text-xs mt-1">
                Actual: {selectedProduction.target_quantity}
              </p>
            </div>
          </div>

          {displayForm.displayQuantity && displayForm.displayTarget && (
            <div className="mt-4 p-3 bg-slate-900 rounded-lg">
              <p className="text-slate-300 text-sm">Client will see:</p>
              <p className="text-green-300 font-semibold">
                {displayForm.displayQuantity} / {displayForm.displayTarget} {selectedProduction.product_unit}
              </p>
              <p className="text-slate-400 text-xs">
                Progress: {Math.round((displayForm.displayQuantity / displayForm.displayTarget) * 100)}%
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onUpdate}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Save Display Settings
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>

        {(selectedProduction.display_quantity_produced || selectedProduction.display_target_quantity) && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <button
              onClick={handleReset}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
            >
              Reset to Actual Values
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayModal;