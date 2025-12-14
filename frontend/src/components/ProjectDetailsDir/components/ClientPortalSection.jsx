import React from 'react';
import { Key, Copy } from 'lucide-react';

const ClientPortalSection = ({ project, onSetPassword }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-6 mb-8">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Key className="text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-white">Client Portal Access</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Project ID</p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-slate-900 rounded text-blue-300 font-mono">{project.id}</code>
                <button
                  onClick={() => copyToClipboard(project.id.toString())}
                  className="p-2 hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="text-slate-400" size={16} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Portal URL</p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-slate-900 rounded text-blue-300 font-mono text-sm">/client/login</code>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/client/login`)}
                  className="p-2 hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="text-slate-400" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onSetPassword}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Key size={16} />
          Set Password
        </button>
      </div>
    </div>
  );
};

export default ClientPortalSection;