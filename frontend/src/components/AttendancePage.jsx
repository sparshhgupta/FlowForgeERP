import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from './Navbar';
import { Save, AlertCircle, CheckCircle, Clock, UserCheck } from 'lucide-react';

const AttendancePage = () => {
  const { user, getAuthHeader, API_URL } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [summary, setSummary] = useState({
    total_workers: 0,
    present_count: 0,
    absent_count: 0,
    half_day_count: 0,
    not_marked_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchTodayAttendance();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const [detailsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/attendance/today/details`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/attendance/today`, { headers: getAuthHeader() })
      ]);

      setWorkers(detailsRes.data);
      setSummary(summaryRes.data);
      
      // Initialize attendance state
      const attendanceMap = {};
      detailsRes.data.forEach(worker => {
        attendanceMap[worker.id] = {
          status: worker.status || 'present',
          check_in_time: worker.check_in_time || '',
          notes: worker.attendance_notes || '',
          attendance_id: worker.attendance_id
        };
      });
      
      setAttendance(attendanceMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setLoading(false);
    }
  };

  const handleAttendanceChange = (workerId, field, value) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value
      }
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const attendanceRecords = Object.entries(attendance).map(([workerId, data]) => ({
        worker_id: parseInt(workerId),
        status: data.status,
        check_in_time: data.check_in_time || null,
        notes: data.notes || null
      }));

      await axios.post(
        `${API_URL}/attendance/bulk`,
        { attendance_records: attendanceRecords },
        { headers: getAuthHeader() }
      );

      setMessage({ type: 'success', text: 'Attendance saved successfully! Workers can now be assigned to projects.' });
      fetchTodayAttendance();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    }
    setSaving(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-400';
      case 'absent': return 'text-red-400';
      case 'half-day': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500 bg-opacity-20 border-green-500';
      case 'absent': return 'bg-red-500 bg-opacity-20 border-red-500';
      case 'half-day': return 'bg-yellow-500 bg-opacity-20 border-yellow-500';
      default: return 'bg-slate-700 bg-opacity-20 border-slate-600';
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
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Daily Attendance</h1>
              <p className="text-slate-400">Mark attendance for all workers - Independent of project assignment</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Clock size={20} />
                <span className="text-lg font-semibold">{currentTime}</span>
              </div>
              <p className="text-slate-400 text-sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Total Workers</p>
            <p className="text-2xl font-bold text-white">{summary.total_workers}</p>
          </div>
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-green-500 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Present</p>
            <p className="text-2xl font-bold text-green-400">{summary.present_count}</p>
          </div>
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-red-500 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Absent</p>
            <p className="text-2xl font-bold text-red-400">{summary.absent_count}</p>
          </div>
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-yellow-500 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Half Day</p>
            <p className="text-2xl font-bold text-yellow-400">{summary.half_day_count}</p>
          </div>
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-600 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Not Marked</p>
            <p className="text-2xl font-bold text-slate-400">{summary.not_marked_count}</p>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-500 bg-opacity-20 border border-green-500 text-green-300'
                : 'bg-red-500 bg-opacity-20 border border-red-500 text-red-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Attendance Marking */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserCheck className="text-blue-400" size={28} />
              Mark Attendance
            </h2>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save All Attendance'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Worker Name</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Check-in Time</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Notes</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Assignments</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{worker.name}</p>
                        {worker.address && (
                          <p className="text-sm text-slate-500">{worker.address}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-300">{worker.phone || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={attendance[worker.id]?.status || 'present'}
                        onChange={(e) => handleAttendanceChange(worker.id, 'status', e.target.value)}
                        className={`px-3 py-2 bg-slate-900 border rounded-lg text-white focus:outline-none focus:border-blue-500 font-medium ${
                          attendance[worker.id]?.status ? getStatusBgColor(attendance[worker.id].status) : ''
                        }`}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="half-day">Half Day</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="time"
                        value={attendance[worker.id]?.check_in_time || ''}
                        onChange={(e) => handleAttendanceChange(worker.id, 'check_in_time', e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        disabled={attendance[worker.id]?.status === 'absent'}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="text"
                        value={attendance[worker.id]?.notes || ''}
                        onChange={(e) => handleAttendanceChange(worker.id, 'notes', e.target.value)}
                        placeholder="Add notes..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-4 px-4">
                      {worker.assignments && worker.assignments.length > 0 && worker.assignments[0].project_id ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {worker.assignments.map((assignment, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded text-xs whitespace-nowrap"
                              title={`${assignment.project_name}${assignment.machine_assigned ? ` - ${assignment.machine_assigned}` : ''}`}
                            >
                              {assignment.project_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">Not assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-slate-400 text-sm">
              <p>💡 Tip: Mark attendance first, then assign present workers to projects from the Projects page</p>
            </div>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">How Attendance Works:</h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">1.</span>
              <span>Mark attendance for all workers at the start of the day (present/absent/half-day)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">2.</span>
              <span>Set check-in time (optional) to track arrival times</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">3.</span>
              <span>After marking attendance, go to Projects page to assign present workers to specific projects and machines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">4.</span>
              <span>Workers can be reassigned to different projects throughout the day as needed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">5.</span>
              <span>Attendance resets daily - mark fresh attendance each day</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AttendancePage;