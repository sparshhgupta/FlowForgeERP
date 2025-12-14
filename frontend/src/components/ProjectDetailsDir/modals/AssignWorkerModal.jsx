import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const AssignWorkerModal = ({ 
  isOpen, 
  onClose, 
  unassignedAvailableWorkers, 
  allMachines, 
  id, 
  getAuthHeader, 
  API_URL, 
  fetchAllData 
}) => {
  const [assignmentForm, setAssignmentForm] = useState({ worker_id: '', machine_id: '', notes: '' });

  const handleAssignWorker = async () => {
    if (!assignmentForm.worker_id) {
      alert('Please select a worker');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/attendance/assign`,
        {
          worker_id: assignmentForm.worker_id,
          project_id: id,
          machine_id: assignmentForm.machine_id || null,
          notes: assignmentForm.notes
        },
        { headers: getAuthHeader() }
      );
      
      onClose();
      setAssignmentForm({ worker_id: '', machine_id: '', notes: '' });
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign worker');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Assign Worker (Today)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {unassignedAvailableWorkers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 mb-2">No available workers</p>
            <p className="text-slate-500 text-sm">All present workers are assigned or no workers marked present today.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-slate-300 mb-2 text-sm">Worker *</label>
                <select
                  value={assignmentForm.worker_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, worker_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select worker...</option>
                  {unassignedAvailableWorkers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} {worker.phone && `- ${worker.phone}`} ({worker.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm">Machine</label>
                <select
                  value={assignmentForm.machine_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, machine_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select machine (optional)...</option>
                  {allMachines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} - {machine.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm">Notes</label>
                <textarea
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm({...assignmentForm, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAssignWorker}
                disabled={!assignmentForm.worker_id}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg"
              >
                Assign Worker
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

export default AssignWorkerModal;