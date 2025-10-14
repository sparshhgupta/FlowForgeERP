import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Package, Calendar, TrendingUp, CheckCircle, Clock, AlertCircle, LogOut } from 'lucide-react';

const ClientPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const password = sessionStorage.getItem('client_password');
    const storedProjectId = sessionStorage.getItem('client_project_id');

    if (!password || storedProjectId !== id) {
      navigate('/client/login');
      return;
    }

    fetchProjectStatus(password);
  }, [id]);

  const fetchProjectStatus = async (password) => {
    try {
      const response = await axios.get(`${API_URL}/client/project/${id}/${password}`);
      setProjectData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load project data. Please try logging in again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/client/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'pitching': { label: 'Pitching', color: 'bg-purple-500', icon: Clock },
      'received': { label: 'Order Received', color: 'bg-blue-500', icon: CheckCircle },
      'started': { label: 'Production Started', color: 'bg-green-500', icon: TrendingUp },
      'on-hold': { label: 'On Hold', color: 'bg-yellow-500', icon: AlertCircle },
      'finished-production': { label: 'Production Finished', color: 'bg-teal-500', icon: CheckCircle },
      'payment-pending': { label: 'Payment Pending', color: 'bg-orange-500', icon: Clock },
      'closed': { label: 'Completed', color: 'bg-green-600', icon: CheckCircle }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500', icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/client/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const { project, production, timeline } = projectData;
  const statusInfo = getStatusInfo(project.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building2 className="text-blue-400" size={32} />
            <div>
              <h1 className="text-xl font-bold text-white">Parasnath Build</h1>
              <p className="text-xs text-slate-400">Client Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{project.name}</h2>
              <p className="text-slate-400">{project.description}</p>
            </div>
            <div className={`px-4 py-2 ${statusInfo.color} bg-opacity-20 border border-current rounded-lg flex items-center gap-2`}>
              <StatusIcon className="text-white" size={20} />
              <span className="text-white font-semibold">{statusInfo.label}</span>
            </div>
          </div>

          <div className="text-slate-300">
            <p className="mb-1">Project ID: <span className="text-white font-semibold">#{project.id}</span></p>
            <p>Client: <span className="text-white font-semibold">{project.client_name}</span></p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Overall Progress</h3>
            <span className="text-3xl font-bold text-blue-400">{project.overall_completion}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${project.overall_completion}%` }}
            />
          </div>
        </div>

        {/* Key Dates */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Start Date</h3>
            </div>
            <p className="text-xl font-bold text-white">{formatDate(project.start_date)}</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-green-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Expected Delivery</h3>
            </div>
            <p className="text-xl font-bold text-white">{formatDate(project.expected_delivery_date)}</p>
          </div>

          {project.actual_delivery_date && (
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-teal-400" size={20} />
                <h3 className="text-slate-400 text-sm font-medium">Delivered On</h3>
              </div>
              <p className="text-xl font-bold text-teal-400">{formatDate(project.actual_delivery_date)}</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Production Details */}
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="text-blue-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Production Status</h2>
            </div>

            {production.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No production details available yet</p>
            ) : (
              <div className="space-y-4">
                {production.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 bg-opacity-50 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">{item.product_name}</h4>
                        <p className="text-sm text-slate-400 capitalize">{item.product_type}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-sm font-medium">
                        {item.completion_percentage}%
                      </span>
                    </div>

                    <p className="text-slate-300 text-sm mb-2">
                      {item.quantity_produced} / {item.target_quantity} {item.product_unit}
                    </p>

                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.completion_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Timeline */}
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-green-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Project Timeline</h2>
            </div>

            {timeline.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No timeline updates yet</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((entry, index) => {
                  const entryStatusInfo = getStatusInfo(entry.status);
                  const EntryIcon = entryStatusInfo.icon;
                  
                  return (
                    <div key={entry.id} className="relative">
                      {index < timeline.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-700" />
                      )}
                      <div className="flex gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 ${entryStatusInfo.color} bg-opacity-20 rounded-full flex items-center justify-center border-2 border-current`}>
                          <EntryIcon size={16} className="text-white" />
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-white font-medium">{entryStatusInfo.label}</p>
                          {entry.notes && (
                            <p className="text-slate-400 text-sm mt-1">{entry.notes}</p>
                          )}
                          <p className="text-slate-500 text-xs mt-2">
                            {new Date(entry.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Need Help or Have Questions?</h3>
          <p className="text-slate-300 mb-4">
            Our team is here to assist you with any queries about your project.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-slate-300">
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="font-medium">info@parasnathbuild.com</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Phone</p>
              <p className="font-medium">+91-XXXXXXXXXX</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border-t border-slate-700 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-slate-400">
          <p>&copy; 2025 Parasnath Build. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortal;