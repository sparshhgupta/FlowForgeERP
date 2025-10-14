import React from 'react';
import { Calendar, Users, CheckCircle, TrendingUp } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  const statusColors = {
    'pitching': 'bg-purple-500 bg-opacity-20 text-purple-400 border-purple-500',
    'received': 'bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500',
    'started': 'bg-green-500 bg-opacity-20 text-green-400 border-green-500',
    'on-hold': 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500',
    'finished-production': 'bg-teal-500 bg-opacity-20 text-teal-400 border-teal-500',
    'payment-pending': 'bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500',
    'closed': 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const completion = parseFloat(project.overall_completion || 0);

  return (
    <div
      onClick={onClick}
      className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer hover:transform hover:scale-105"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{project.name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            statusColors[project.status] || statusColors['started']
          }`}
        >
          {project.status?.replace('-', ' ')}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Progress Bar */}
      {completion > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400">Overall Progress</span>
            <span className="text-xs font-semibold text-blue-400">{completion.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(completion, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar size={16} className="text-slate-500" />
          <span className="text-sm">
            Target: {formatDate(project.target_completion_date)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <Users size={16} className="text-slate-500" />
          <span className="text-sm">
            Team: {project.total_workers || 0} workers
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <CheckCircle size={16} className="text-slate-500" />
          <span className="text-sm">
            Today: {project.workers_today || 0} working
          </span>
        </div>

        {project.total_paid > 0 && (
          <div className="flex items-center gap-2 text-slate-300">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-sm">
              Paid: ₹{new Intl.NumberFormat('en-IN').format(project.total_paid)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
        <p className="text-xs text-slate-500">
          By: {project.created_by_name || 'Unknown'}
        </p>
        {project.client_name && (
          <p className="text-xs text-slate-400">
            Client: {project.client_name}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;