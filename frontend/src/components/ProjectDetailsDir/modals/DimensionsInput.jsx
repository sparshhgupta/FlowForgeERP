// Save this file at: src/components/ProjectDetailsDir/modals/DimensionsInput.jsx

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const DimensionsInput = ({ dimensions = {}, onChange }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const dimensionEntries = Object.entries(dimensions);

  const handleAddDimension = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    
    const updatedDimensions = {
      ...dimensions,
      [newKey.trim()]: newValue.trim()
    };
    
    onChange(updatedDimensions);
    setNewKey('');
    setNewValue('');
  };

  const handleRemoveDimension = (key) => {
    const updatedDimensions = { ...dimensions };
    delete updatedDimensions[key];
    onChange(updatedDimensions);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDimension();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-slate-300 mb-2 text-sm">
        Dimensions (Optional)
      </label>

      {/* Display existing dimensions */}
      {dimensionEntries.length > 0 && (
        <div className="space-y-2 mb-3">
          {dimensionEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            >
              <span className="text-slate-400 text-sm font-medium">{key}:</span>
              <span className="text-white text-sm flex-1">{value}</span>
              <button
                type="button"
                onClick={() => handleRemoveDimension(key)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new dimension */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Key (e.g., length)"
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Value (e.g., 50m)"
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleAddDimension}
          disabled={!newKey.trim() || !newValue.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <p className="text-slate-500 text-xs">
        Add key-value pairs for dimensions (e.g., length: 50m, width: 30m)
      </p>
    </div>
  );
};

export default DimensionsInput;