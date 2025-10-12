import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { UserPlus, Save, X } from 'lucide-react';

const AttendanceMarker = ({ projects, onUpdate }) => {
  const { getAuthHeader, API_URL } = useAuth();
  const [formData, setFormData] = useState({
    project_id: '',
    worker_name: '',
    status: 'present',
    machine_assigned: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${API_URL}/attendance`, formData, {
        headers: getAuthHeader()
      });

      setMessage({ type: 'success', text: 'Attendance marked successfully!' });
      setFormData({
        project_id: formData.project_id,
        worker_name: '',
        status: 'present',
        machine_assigned: ''
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to mark attendance' 
      });
    }
    setLoading(false);
  };

  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="text-blue-400" size={24} />
        <h3 className="text-xl font-bold text-white">Mark Attendance</h3>
      </div>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500 bg-opacity-20 border border-green-500 text-green-300'
              : 'bg-red-500 bg-opacity-20 border border-red-500 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              Project *
            </label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Select Project</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              Worker Name *
            </label>
            <input
              type="text"
              name="worker_name"
              value={formData.worker_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter worker name"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              Machine Assigned
            </label>
            <input
              type="text"
              name="machine_assigned"
              value={formData.machine_assigned}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g., Lathe Machine 1"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Mark Attendance'}
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData({
                project_id: '',
                worker_name: '',
                status: 'present',
                machine_assigned: ''
              });
              setMessage({ type: '', text: '' });
            }}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <X size={20} />
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceMarker;