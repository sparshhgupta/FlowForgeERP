import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from './Navbar';
import { Building2, Users, CheckCircle, TrendingUp, AlertCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { getAuthHeader, API_URL } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalWorkers: 0,
    presentToday: 0,
    notMarkedCount: 0
  });
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchDashboardData();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, workersRes, attendanceRes, assignmentsRes] = await Promise.all([
        axios.get(`${API_URL}/projects`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/workers`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/attendance/today`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/attendance/assignments/today`, { headers: getAuthHeader() })
      ]);

      const projects = projectsRes.data;
      const attendanceSummary = attendanceRes.data;

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalWorkers: attendanceSummary.total_workers || 0,
        presentToday: attendanceSummary.present_count || 0,
        notMarkedCount: attendanceSummary.not_marked_count || 0
      });

      setTodayAssignments(assignmentsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's your overview for today.</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Clock size={20} />
              <span className="text-lg font-semibold">{currentTime}</span>
            </div>
            <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Total Projects</h3>
              <Building2 className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
            <p className="text-sm text-slate-500 mt-1">{stats.activeProjects} active</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Active Projects</h3>
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{stats.activeProjects}</p>
            <p className="text-sm text-slate-500 mt-1">In progress</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Total Workers</h3>
              <Users className="text-purple-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalWorkers}</p>
            <p className="text-sm text-slate-500 mt-1">Registered</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-green-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Present Today</h3>
              <CheckCircle className="text-green-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.presentToday}</p>
            <p className="text-sm text-slate-500 mt-1">Marked present</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-yellow-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Not Marked</h3>
              <AlertCircle className="text-yellow-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.notMarkedCount}</p>
            <p className="text-sm text-slate-500 mt-1">Pending attendance</p>
          </div>
        </div>

        {/* Alert for unmarked attendance */}
        {stats.notMarkedCount > 0 && (
          <div className="mb-8 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-yellow-400" size={24} />
            <div className="flex-1">
              <p className="text-yellow-300 font-medium">Attendance not marked for {stats.notMarkedCount} workers</p>
              <p className="text-yellow-400 text-sm">Please mark attendance to assign workers to projects</p>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Mark Now
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-colors text-left"
            >
              <Building2 size={24} className="mb-2" />
              <h3 className="font-semibold">View Projects</h3>
              <p className="text-sm text-blue-100 mt-1">Manage all projects</p>
            </button>

            <button
              onClick={() => navigate('/workers')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl transition-colors text-left"
            >
              <Users size={24} className="mb-2" />
              <h3 className="font-semibold">Manage Workers</h3>
              <p className="text-sm text-purple-100 mt-1">View worker details</p>
            </button>

            <button
              onClick={() => navigate('/attendance')}
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl transition-colors text-left"
            >
              <CheckCircle size={24} className="mb-2" />
              <h3 className="font-semibold">Mark Attendance</h3>
              <p className="text-sm text-green-100 mt-1">Today's attendance</p>
            </button>

            <button
              onClick={() => navigate('/projects')}
              className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl transition-colors text-left"
            >
              <TrendingUp size={24} className="mb-2" />
              <h3 className="font-semibold">Production Status</h3>
              <p className="text-sm text-orange-100 mt-1">Track progress</p>
            </button>
          </div>
        </div>

        {/* Today's Project Assignments */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Today's Project Assignments</h2>
          {todayAssignments.length === 0 || todayAssignments.every(p => !p.assigned_workers || p.assigned_workers.length === 0) ? (
            <div className="text-center py-8">
              <AlertCircle className="text-slate-500 mx-auto mb-3" size={48} />
              <p className="text-slate-400">No workers assigned to projects today</p>
              <p className="text-slate-500 text-sm mt-2">Mark attendance first, then assign workers to projects</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAssignments.map((project) => {
                const workers = project.assigned_workers.filter(w => w.worker_id !== null);
                if (workers.length === 0) return null;
                
                return (
                  <div
                    key={project.project_id}
                    className="bg-slate-900 bg-opacity-50 rounded-lg p-4 cursor-pointer hover:bg-opacity-70 transition-all"
                    onClick={() => navigate(`/project/${project.project_id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium text-lg">{project.project_name}</h4>
                        <p className="text-sm text-slate-400">{workers.length} workers assigned today</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded-full text-xs font-medium">
                        {project.project_status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workers.map((worker, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-slate-800 rounded-lg text-sm"
                        >
                          <span className="text-white font-medium">{worker.worker_name}</span>
                          {worker.machine_assigned && (
                            <span className="text-slate-400 ml-2">• {worker.machine_assigned}</span>
                          )}
                        </div>
                      ))}
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

export default Dashboard;