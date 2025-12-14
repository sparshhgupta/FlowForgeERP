import React from 'react';
import { Edit } from 'lucide-react';
import { statusColors } from '../utils/constants';

const ProjectHeader = ({ project, canEdit, onEditClick, formatDate }) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
        <p className="text-slate-400">{project.description}</p>
        {project.client_name && (
          <p className="text-slate-500 mt-2">Client: {project.client_name}</p>
        )}
      </div>
      <div className="flex gap-3">
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium text-white ${
            statusColors[project.status] || 'bg-gray-500'
          }`}
        >
          {project.status}
        </span>
        {canEdit && (
          <button
            onClick={onEditClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;