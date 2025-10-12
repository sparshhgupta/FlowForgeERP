import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Navbar from './Navbar';
import { ArrowLeft, Package, Users, Calendar, TrendingUp, Edit, UserPlus, X, UserMinus } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader, API_URL, user } = useAuth();
  const [projectData, setProjectData] = useState(null);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduction, setEditingProduction] = useState(null);
  const [editValue, setEditValue] = useState({ quantity: '', workers: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    worker_id: '',
    machine_assigned: '',
    notes: ''
  });

  useEffect(() => {
    fetchProjectDetails();
    fetchAvailableWorkers();
    fetchTodayAssignments();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${id}`, {
        headers: getAuthHeader()
      });
      setProjectData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project details:', error);
      setLoading(false);
    }
  };

  const fetchAvailableWorkers = async () => {
    try {
      const response = await axios.get(`${API_URL}/attendance/available`, {
        headers: getAuthHeader()
      });
      setAvailableWorkers(response.data);
    } catch (error) {
      console.error('Error fetching available workers:', error);
    }
  };

  const fetchTodayAssignments = async () => {
    try {
      const response = await axios.get(`${API_URL}/attendance/assignments/project/${id}`, {
        headers: getAuthHeader()
      });
      setTodayAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleUpdateProduction = async (productionId) => {
    try {
      const updateData = {};
      if (editValue.quantity !== '') updateData.quantity_produced = parseInt(editValue.quantity);
      if (editValue.workers !== '') updateData.assigned_workers = parseInt(editValue.workers);

      await axios.put(
        `${API_URL}/products/production/${productionId}`,
        updateData,
        { headers: getAuthHeader() }
      );
      setEditingProduction(null);
      fetchProjectDetails();
    } catch (error) {
      console.error('Error updating production:', error);
      alert('Failed to update production');
    }
  };

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
          machine_assigned: assignmentForm.machine_assigned,
          notes: assignmentForm.notes
        },
        { headers: getAuthHeader() }
      );
      
      setShowAssignModal(false);
      setAssignmentForm({ worker_id: '', machine_assigned: '', notes: '' });
      fetchTodayAssignments();
      fetchAvailableWorkers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign worker');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this worker assignment?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/attendance/assignments/${assignmentId}`,
        { headers: getAuthHeader() }
      );
      fetchTodayAssignments();
      fetchAvailableWorkers();
    } catch (error) {
      alert('Failed to remove assignment');
    }
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

  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Project not found</div>
        </div>
      </div>
    );
  }

  const { project, production, workers } = projectData;

  const chartData = production.map((item) => ({
    name: item.product_name,
    value: parseInt(item.quantity_produced),
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const canEdit = user?.role === 'owner' || user?.role === 'supervisor';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const statusColors = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    'on-hold': 'bg-yellow-500'
  };

  const attendanceStatusColors = {
    present: 'bg-green-500 text-green-100',
    absent: 'bg-red-500 text-red-100',
    'half-day': 'bg-yellow-500 text-yellow-100'
  };

  const unassignedAvailableWorkers = availableWorkers.filter(
    w => !todayAssignments.find(a => a.worker_id === w.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Projects
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <p className="text-slate-400">{project.description}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium text-white ${
              statusColors[project.status] || statusColors.active
            }`}
          >
            {project.status}
          </span>
        </div>

        {/* Project Info Cards */}
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
              <h3 className="text-slate-400 text-sm font-medium">Target Completion</h3>
            </div>
            <p className="text-xl font-bold text-white">{formatDate(project.target_completion_date)}</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-purple-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Workers Today</h3>
            </div>
            <p className="text-xl font-bold text-white">{todayAssignments.length}</p>
            <p className="text-sm text-slate-500">Assigned to this project</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Production Details */}
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="text-blue-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Production Overview</h2>
            </div>

            <div className="space-y-4 mb-6">
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

                  <div className="space-y-3">
                    {editingProduction === item.id && canEdit ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-slate-400 text-sm w-24">Quantity:</label>
                          <input
                            type="number"
                            value={editValue.quantity}
                            onChange={(e) => setEditValue({...editValue, quantity: e.target.value})}
                            placeholder={item.quantity_produced}
                            className="flex-1 px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-slate-400 text-sm w-24">Workers:</label>
                          <input
                            type="number"
                            value={editValue.workers}
                            onChange={(e) => setEditValue({...editValue, workers: e.target.value})}
                            placeholder={item.assigned_workers || 0}
                            className="flex-1 px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateProduction(item.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProduction(null)}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-300 text-sm">
                            Progress: {item.quantity_produced} / {item.target_quantity} {item.product_unit}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingProduction(item.id);
                                setEditValue({ quantity: item.quantity_produced, workers: item.assigned_workers || 0 });
                              }}
                              className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                              <Edit className="text-slate-400" size={16} />
                            </button>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm mb-2">
                          Workers assigned: {item.assigned_workers || 0}
                        </div>
                      </div>
                    )}

                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.completion_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {production.length > 0 && chartData.some(d => d.value > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Production Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Workers Assignment */}
          <div className="space-y-6">
            {/* Today's Assigned Workers */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="text-purple-400" size={24} />
                  Today's Assignments
                </h2>
                {canEdit && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <UserPlus size={16} />
                    Assign
                  </button>
                )}
              </div>

              {todayAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-2">No workers assigned today</p>
                  <p className="text-slate-500 text-sm">Assign present workers from attendance to this project</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-slate-900 bg-opacity-50 rounded-lg p-3 hover:bg-opacity-70 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/worker/${assignment.worker_id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{assignment.worker_name}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              attendanceStatusColors[assignment.attendance_status] || 'bg-slate-700 text-slate-300'
                            }`}>
                              {assignment.attendance_status}
                            </span>
                          </div>
                          {assignment.worker_phone && (
                            <p className="text-xs text-slate-400">{assignment.worker_phone}</p>
                          )}
                          {assignment.machine_assigned && (
                            <div className="flex items-center gap-1 mt-1">
                              <TrendingUp size={12} className="text-slate-500" />
                              <p className="text-xs text-slate-400">{assignment.machine_assigned}</p>
                            </div>
                          )}
                          {assignment.check_in_time && (
                            <p className="text-xs text-slate-500">Check-in: {assignment.check_in_time}</p>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded transition-colors"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permanent Workers */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Permanent Team</h2>
              {workers.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-sm">No permanent workers assigned</p>
              ) : (
                <div className="space-y-2">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="bg-slate-900 bg-opacity-50 rounded-lg p-3 cursor-pointer hover:bg-opacity-70 transition-all"
                      onClick={() => navigate(`/worker/${worker.id}`)}
                    >
                      <p className="text-white font-medium text-sm">{worker.name}</p>
                      {worker.phone && (
                        <p className="text-xs text-slate-400">{worker.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-3">
                These workers are permanently assigned to the project
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Assign Worker Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Assign Worker to Project</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {unassignedAvailableWorkers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 mb-2">No available workers</p>
                <p className="text-slate-500 text-sm">All present workers are already assigned to this project, or no workers are marked present today.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-slate-300 mb-2 text-sm">Select Worker *</label>
                    <select
                      value={assignmentForm.worker_id}
                      onChange={(e) => setAssignmentForm({...assignmentForm, worker_id: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Choose a worker...</option>
                      {unassignedAvailableWorkers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name} {worker.phone && `- ${worker.phone}`} ({worker.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-2 text-sm">Machine Assigned</label>
                    <input
                      type="text"
                      value={assignmentForm.machine_assigned}
                      onChange={(e) => setAssignmentForm({...assignmentForm, machine_assigned: e.target.value})}
                      placeholder="e.g., Lathe Machine 1"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
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
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    Assign Worker
                  </button>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;