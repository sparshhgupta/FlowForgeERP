import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from './Navbar';
import { DollarSign, AlertCircle, Plus, Eye, Calendar, CreditCard } from 'lucide-react';

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { getAuthHeader, API_URL } = useAuth();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/payments/pending`, {
        headers: getAuthHeader()
      });
      setPendingPayments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (project) => {
    const deliveryDate = new Date(project.expected_delivery_date);
    const today = new Date();
    const daysUntilDelivery = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

    if (project.actual_delivery_date) return 'border-green-500';
    if (daysUntilDelivery < 0) return 'border-red-500';
    if (daysUntilDelivery < 7) return 'border-yellow-500';
    return 'border-blue-500';
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Tracking</h1>
          <p className="text-slate-400">Monitor pending payments and project financials</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-yellow-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Pending Projects</h3>
            </div>
            <p className="text-3xl font-bold text-white">{pendingPayments.length}</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Total Received</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {formatCurrency(pendingPayments.reduce((sum, p) => sum + parseFloat(p.total_paid || 0), 0))}
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Upcoming Deliveries</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {pendingPayments.filter(p => {
                const daysUntil = Math.ceil((new Date(p.expected_delivery_date) - new Date()) / (1000 * 60 * 60 * 24));
                return daysUntil > 0 && daysUntil < 14;
              }).length}
            </p>
          </div>
        </div>

        {/* Pending Payments List */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Projects Awaiting Payment</h2>

          {pendingPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="text-slate-500 mx-auto mb-4" size={48} />
              <p className="text-slate-400 text-lg">No pending payments</p>
              <p className="text-slate-500 text-sm mt-2">All projects are up to date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((project) => {
                const deliveryDate = new Date(project.expected_delivery_date);
                const today = new Date();
                const daysUntilDelivery = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntilDelivery < 0;
                const isUrgent = daysUntilDelivery >= 0 && daysUntilDelivery < 7;

                return (
                  <div
                    key={project.project_id}
                    className={`bg-slate-900 bg-opacity-50 rounded-lg p-6 border-l-4 ${getStatusColor(project)} hover:bg-opacity-70 transition-all cursor-pointer`}
                    onClick={() => navigate(`/project/${project.project_id}`)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{project.project_name}</h3>
                        <p className="text-slate-400">{project.client_name}</p>
                        {project.client_phone && (
                          <p className="text-slate-500 text-sm">{project.client_phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(project.total_paid)}</p>
                        <p className="text-sm text-slate-400">Received</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Expected Delivery</p>
                        <p className="text-white font-medium">{formatDate(project.expected_delivery_date)}</p>
                        {isOverdue && (
                          <span className="inline-block mt-1 px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-xs">
                            Overdue by {Math.abs(daysUntilDelivery)} days
                          </span>
                        )}
                        {isUrgent && !isOverdue && (
                          <span className="inline-block mt-1 px-2 py-1 bg-yellow-500 bg-opacity-20 text-yellow-400 rounded text-xs">
                            Due in {daysUntilDelivery} days
                          </span>
                        )}
                      </div>
                      {project.actual_delivery_date && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Actual Delivery</p>
                          <p className="text-green-400 font-medium">{formatDate(project.actual_delivery_date)}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${project.project_id}`);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${project.project_id}`);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                      >
                        <Plus size={16} />
                        Add Payment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentsPage;