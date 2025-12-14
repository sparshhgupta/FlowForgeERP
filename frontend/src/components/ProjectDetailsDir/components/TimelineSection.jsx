import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

const TimelineSection = ({ timeline }) => {
  return (
    <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="text-blue-400" size={24} />
        <h2 className="text-2xl font-bold text-white">Project Timeline</h2>
      </div>

      <div className="space-y-4">
        {timeline.map((entry, index) => (
          <TimelineItem key={entry.id} entry={entry} isLast={index === timeline.length - 1} />
        ))}
      </div>
    </div>
  );
};

const TimelineItem = ({ entry, isLast }) => {
  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-700" />
      )}
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center border-2 border-blue-500">
          <CheckCircle size={16} className="text-blue-400" />
        </div>
        <div className="flex-1 pb-6">
          <p className="text-white font-medium capitalize">{entry.status.replace('-', ' ')}</p>
          {entry.notes && (
            <p className="text-slate-400 text-sm mt-1">{entry.notes}</p>
          )}
          <p className="text-slate-500 text-xs mt-2">
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            {entry.changed_by_name && ` by ${entry.changed_by_name}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimelineSection;