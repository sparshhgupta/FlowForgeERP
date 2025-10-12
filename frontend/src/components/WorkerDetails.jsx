import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from './Navbar';
import { ArrowLeft, Phone, MapPin, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader, API_URL } = useAuth();
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkerDetails();
  }, [id]);

  const fetchWorkerDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/workers/${id}`, {
        headers: getAuthHeader()
      });
      setWorkerData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching worker details:', error);
      setLoading(false);
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

  if (!workerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Worker not found</div>
        </div>
      </div>
    );
  }

  const { worker, attendance, projects } = workerData;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // HH:MM
  };

  const statusColors = {
    present: 'bg-green-500 text-green-100',
    absent: 'bg-red-500 text-red-100',
    'half-day': 'bg-yellow-500 text-yellow-100'
  };

  const statusIcons = {
    present: CheckCircle,
    absent: XCircle,
    'half-day': AlertCircle
  };

  // Calculate attendance stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const halfDays = attendance.filter(a => a.status === 'half-day').length;
  const attendancePercentage = totalDays > 0 ? ((presentDays + halfDays * 0.5) / totalDays * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/workers')}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Workers
        </button>

        {/* Worker Info Card */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">{worker.name}</h1>
          <div className="grid md:grid-cols-2 gap-4">
            {worker.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-blue-400" size={20} />
                <div>
                  <p className="text-slate-400 text-sm">Phone</p>
                  <p className="text-white">{worker.phone}</p>
                </div>
              </div>
            )}
            {worker.address && (
              <div className="flex items-center gap-3">
                <MapPin className="text-green-400" size={20} />
                <div>
                  <p className="text-slate-400 text-sm">Address</p>
                  <p className="text-white">{worker.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="text-purple-400" size={20} />
              <div>
                <p className="text-slate-400 text-sm">Joined</p>
                <p className="text-white">{formatDate(worker.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Attendance Stats */}
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Attendance Summary</h2>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Overall Attendance</span>
                <span className="text-2xl font-bold text-white">{attendancePercentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs mt-1">Based on last {totalDays} days</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{presentDays}</p>
                <p className="text-sm text-slate-400">Present</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{absentDays}</p>
                <p className="text-sm text-slate-400">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{halfDays}</p>
                <p className="text-sm text-slate-400">Half Day</p>
              </div>
            </div>
          </div>

          {/* Assigned Projects */}
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Assigned Projects</h2>
            {projects.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No permanent projects assigned</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-slate-900 bg-opacity-50 rounded-lg p-4 cursor-pointer hover:bg-opacity-70 transition-all"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{project.name}</h4>
                        <p className="text-sm text-slate-400">Assigned: {formatDate(project.assigned_date)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.is_active 
                          ? 'bg-green-500 bg-opacity-20 text-green-400' 
                          : 'bg-slate-500 bg-opacity-20 text-slate-400'
                      }`}>
                        {project.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-4">
              These are permanent project assignments. Daily assignments are tracked separately.
            </p>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Attendance History (Last 30 Days)</h2>
          {attendance.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No attendance records found</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((record) => {
                const StatusIcon = statusIcons[record.status];
                return (
                  <div
                    key={record.id}
                    className="bg-slate-900 bg-opacity-50 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className={`${statusColors[record.status].split(' ')[1]}`} size={20} />
                      <div>
                        <p className="text-white font-medium">{formatDate(record.date)}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {record.check_in_time && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock size={12} />
                              <span>In: {formatTime(record.check_in_time)}</span>
                            </div>
                          )}
                          {record.check_out_time && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock size={12} />
                              <span>Out: {formatTime(record.check_out_time)}</span>
                            </div>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-xs text-slate-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
                        {record.status}
                      </span>
                      {record.project_name && (
                        <p className="text-sm text-slate-400 mt-1">{record.project_name}</p>
                      )}
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

export default WorkerDetails;