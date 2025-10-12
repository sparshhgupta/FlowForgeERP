import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from './Navbar';
import { Plus, AlertCircle, Edit, Trash2, X, Phone, MapPin, Briefcase } from 'lucide-react';

const WorkersList = () => {
  const navigate = useNavigate();
  const { user, getAuthHeader, API_URL } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${API_URL}/workers`, {
        headers: getAuthHeader()
      });
      setWorkers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(`${API_URL}/workers`, formData, {
        headers: getAuthHeader()
      });

      setShowAddModal(false);
      setFormData({ name: '', phone: '', address: '' });
      fetchWorkers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create worker');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.put(`${API_URL}/workers/${selectedWorker.id}`, formData, {
        headers: getAuthHeader()
      });

      setShowEditModal(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update worker');
    }
  };

  const handleDelete = async (workerId) => {
    if (!window.confirm('Are you sure you want to delete this worker? This will also delete all attendance records.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/workers/${workerId}`, {
        headers: getAuthHeader()
      });
      fetchWorkers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete worker');
    }
  };

  const openEditModal = (worker) => {
    setSelectedWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      address: worker.address || ''
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Workers</h1>
            <p className="text-slate-400">Manage your workforce</p>
          </div>
          {(user?.role === 'owner' || user?.role === 'supervisor') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Worker
            </button>
          )}
        </div>

        {workers.length === 0 ? (
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-12 text-center">
            <AlertCircle className="text-slate-500 mx-auto mb-4" size={48} />
            <p className="text-slate-400 text-lg mb-4">No workers found</p>
            {(user?.role === 'owner' || user?.role === 'supervisor') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Your First Worker
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer group"
                onClick={() => navigate(`/worker/${worker.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{worker.name}</h3>
                    {worker.phone && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <Phone size={14} />
                        <span>{worker.phone}</span>
                      </div>
                    )}
                    {worker.address && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin size={14} />
                        <span>{worker.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(user?.role === 'owner' || user?.role === 'supervisor') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(worker);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {user?.role === 'owner' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(worker.id);
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-slate-500">Active Projects</p>
                      <p className="text-white font-semibold">{worker.active_projects || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Present Today</p>
                      <p className={`font-semibold ${worker.present_today > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {worker.present_today > 0 ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Add New Worker</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAdd}>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">Worker Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2 text-sm">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2 text-sm">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Worker
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Edit Worker</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleEdit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">Worker Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2 text-sm">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2 text-sm">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Worker
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersList;