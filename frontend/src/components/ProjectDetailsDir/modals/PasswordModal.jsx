import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const PasswordModal = ({ isOpen, onClose, id, project, getAuthHeader, API_URL }) => {
  const [clientPassword, setClientPassword] = useState('');

  const handleSetClientPassword = async () => {
    if (clientPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/projects/${id}/client-password`,
        { password: clientPassword },
        { headers: getAuthHeader() }
      );
      alert('Client password set successfully!');
      onClose();
      setClientPassword('');
    } catch (error) {
      alert('Failed to set password');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Set Client Password</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-slate-300 mb-2 text-sm">Password (min 6 characters) *</label>
          <input
            type="text"
            value={clientPassword}
            onChange={(e) => setClientPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter password for client"
          />
          <p className="text-slate-500 text-xs mt-2">
            Share this password with client along with Project ID: {project.id}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSetClientPassword}
            disabled={clientPassword.length < 6}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg"
          >
            Set Password
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

export default PasswordModal;