import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Lock, Hash, AlertCircle } from 'lucide-react';

const ClientLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    project_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/client/login`, formData);
      
      // Store project info in sessionStorage
      sessionStorage.setItem('client_project_id', formData.project_id);
      sessionStorage.setItem('client_password', formData.password);
      sessionStorage.setItem('client_project_name', response.data.project.name);
      
      navigate(`/client/project/${formData.project_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Building2 className="text-white" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Parasnath Build</h1>
          <p className="text-slate-400">Client Portal - Track Your Order</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg flex items-center gap-2 text-red-300">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-slate-300 mb-2 text-sm font-medium">
                Project ID
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="number"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter your project ID"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 mb-2 text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Checking...' : 'View Project Status'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">
              Contact Parasnath Build for your project credentials
            </p>
            <p className="text-xs text-slate-500 text-center mt-2">
              Email: info@parasnathbuild.com | Phone: +91-XXXXXXXXXX
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            © 2025 Parasnath Build. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;