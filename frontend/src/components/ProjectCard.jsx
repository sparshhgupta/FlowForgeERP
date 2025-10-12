import React from 'react';
import { Calendar, Users, CheckCircle } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  const statusColors = {
    active: 'bg-green-500 bg-opacity-20 text-green-400 border-green-500',
    completed: 'bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500',
    'on-hold': 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
            statusColors[project.status] || statusColors.active
          }`}
        >
          {project.status}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
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
            Workers: {project.total_workers || 0}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <CheckCircle size={16} className="text-slate-500" />
          <span className="text-sm">
            Present Today: {project.present_today || 0}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          Created by: {project.created_by_name || 'Unknown'}
        </p>
      </div>
    </div>
  );
};

export default ProjectCard;