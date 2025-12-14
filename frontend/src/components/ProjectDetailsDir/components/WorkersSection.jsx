import React, { useState } from 'react';
import { Users, UserPlus, Plus, UserMinus, Trash2, TrendingUp } from 'lucide-react';
import axios from 'axios';

const WorkersSection = ({
  todayAssignments,
  workers,
  id,
  canEdit,
  onAssignClick,
  onAddWorkerClick,
  fetchProjectDetails,
  fetchAllData,
  getAuthHeader,
  API_URL
}) => {
  const attendanceStatusColors = {
    present: 'bg-green-500 text-green-100',
    absent: 'bg-red-500 text-red-100',
    'half-day': 'bg-yellow-500 text-yellow-100'
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this worker assignment?')) return;

    try {
      await axios.delete(
        `${API_URL}/attendance/assignments/${assignmentId}`,
        { headers: getAuthHeader() }
      );
      fetchAllData();
    } catch (error) {
      alert('Failed to remove assignment');
    }
  };

  const handleRemovePermanentWorker = async (workerId) => {
    if (!window.confirm('Remove this worker from project?')) return;
    
    try {
      await axios.delete(
        `${API_URL}/projects/${id}/workers/${workerId}`,
        { headers: getAuthHeader() }
      );
      fetchProjectDetails();
    } catch (error) {
      alert('Failed to remove worker');
    }
  };

  return (
    <>
      {/* Today's Assignments */}
      <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-purple-400" size={24} />
            Today's Workers
          </h2>
          {canEdit && (
            <button
              onClick={onAssignClick}
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
            <p className="text-slate-500 text-sm">Assign present workers to this project</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-slate-900 bg-opacity-50 rounded-lg p-3 hover:bg-opacity-70 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{assignment.worker_name}</p>
                      {assignment.attendance_status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          attendanceStatusColors[assignment.attendance_status]
                        }`}>
                          {assignment.attendance_status}
                        </span>
                      )}
                    </div>
                    {assignment.worker_phone && (
                      <p className="text-xs text-slate-400">{assignment.worker_phone}</p>
                    )}
                    {assignment.machine_name && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp size={12} className="text-slate-500" />
                        <p className="text-xs text-slate-400">{assignment.machine_name}</p>
                      </div>
                    )}
                    {assignment.check_in_time && (
                      <p className="text-xs text-slate-500">Check-in: {assignment.check_in_time.substring(0,5)}</p>
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Permanent Team</h3>
          {canEdit && (
            <button
              onClick={onAddWorkerClick}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              Add
            </button>
          )}
        </div>

        {workers.length === 0 ? (
          <p className="text-slate-400 text-center py-4 text-sm">No permanent workers</p>
        ) : (
          <div className="space-y-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="bg-slate-900 bg-opacity-50 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-medium text-sm">{worker.name}</p>
                  {worker.phone && (
                    <p className="text-xs text-slate-400">{worker.phone}</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleRemovePermanentWorker(worker.id)}
                    className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WorkersSection;