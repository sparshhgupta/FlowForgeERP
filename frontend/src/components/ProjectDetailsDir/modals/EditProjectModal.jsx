import React from 'react';
import { X } from 'lucide-react';

const EditProjectModal = ({ isOpen, onClose, editProjectForm, setEditProjectForm, onUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Edit Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-slate-300 mb-2 text-sm">Project Name *</label>
            <input
              type="text"
              value={editProjectForm.name}
              onChange={(e) => setEditProjectForm({...editProjectForm, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm">Description</label>
            <textarea
              value={editProjectForm.description}
              onChange={(e) => setEditProjectForm({...editProjectForm, description: e.target.value})}
              rows="3"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm">Project Value (₹)</label>
            <input
              type="number"
              value={editProjectForm.project_value}
              onChange={(e) => setEditProjectForm({...editProjectForm, project_value: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter total project value"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm">Status *</label>
            <select
              value={editProjectForm.status}
              onChange={(e) => setEditProjectForm({...editProjectForm, status: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="pitching">Pitching</option>
              <option value="received">Received</option>
              <option value="started">Started</option>
              <option value="on-hold">On Hold</option>
              <option value="finished-production">Finished Production</option>
              <option value="payment-pending">Payment Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2 text-sm">Expected Delivery</label>
              <input
                type="date"
                value={editProjectForm.expected_delivery_date}
                onChange={(e) => setEditProjectForm({...editProjectForm, expected_delivery_date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2 text-sm">Actual Delivery</label>
              <input
                type="date"
                value={editProjectForm.actual_delivery_date}
                onChange={(e) => setEditProjectForm({...editProjectForm, actual_delivery_date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm">Client Name</label>
            <input
              type="text"
              value={editProjectForm.client_name}
              onChange={(e) => setEditProjectForm({...editProjectForm, client_name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2 text-sm">Client Email</label>
              <input
                type="email"
                value={editProjectForm.client_email}
                onChange={(e) => setEditProjectForm({...editProjectForm, client_email: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2 text-sm">Client Phone</label>
              <input
                type="tel"
                value={editProjectForm.client_phone}
                onChange={(e) => setEditProjectForm({...editProjectForm, client_phone: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onUpdate}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Update Project
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

export default EditProjectModal;