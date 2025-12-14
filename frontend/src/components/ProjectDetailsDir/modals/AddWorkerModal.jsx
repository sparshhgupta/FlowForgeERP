import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const AddWorkerModal = ({ 
  isOpen, 
  onClose, 
  availablePermanentWorkers, 
  id, 
  getAuthHeader, 
  API_URL, 
  fetchProjectDetails 
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  const handleAddPermanentWorker = async () => {
    try {
      await axios.post(
        `${API_URL}/projects/${id}/workers`,
        { worker_id: selectedWorkerId },
        { headers: getAuthHeader() }
      );
      onClose();
      setSelectedWorkerId('');
      fetchProjectDetails();
    } catch (error) {
      alert('Failed to add worker');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Add Permanent Worker</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {availablePermanentWorkers.length === 0 ? (
          <p className="text-slate-400 text-center py-4">All workers already assigned</p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-slate-300 mb-2 text-sm">Select Worker *</label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a worker...</option>
                {availablePermanentWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} {worker.phone && `- ${worker.phone}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddPermanentWorker}
                disabled={!selectedWorkerId}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg"
              >
                Add Worker
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddWorkerModal;