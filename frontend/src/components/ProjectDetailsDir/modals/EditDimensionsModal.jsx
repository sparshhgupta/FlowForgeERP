import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import DimensionsInput from './DimensionsInput';

const EditDimensionsModal = ({ 
  isOpen, 
  onClose, 
  production,
  getAuthHeader, 
  API_URL, 
  fetchProjectDetails 
}) => {
  const [dimensions, setDimensions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (production?.dimensions) {
      // Parse dimensions if it's a string, otherwise use as-is
      try {
        const parsedDimensions = typeof production.dimensions === 'string' 
          ? JSON.parse(production.dimensions) 
          : production.dimensions;
        console.log('Loaded dimensions:', parsedDimensions);
        setDimensions(parsedDimensions || {});
      } catch (error) {
        console.error('Error parsing dimensions:', error);
        setDimensions({});
      }
    } else {
      setDimensions({});
    }
  }, [production]);

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        dimensions: Object.keys(dimensions).length > 0 ? dimensions : null
      };

      console.log('Saving dimensions to:', `${API_URL}/products/production/${production.id}/dimensions`);
      console.log('Payload:', payload);

      const response = await axios.put(
        `${API_URL}/products/production/${production.id}/dimensions`,
        payload,
        { headers: getAuthHeader() }
      );

      console.log('Response:', response.data);

      onClose();
      fetchProjectDetails();
    } catch (error) {
      console.error('Error updating dimensions:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to update dimensions');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen || !production) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Edit Dimensions</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white" disabled={loading}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-slate-400 text-sm mb-2">Product:</p>
          <p className="text-white font-medium">{production.product_name}</p>
        </div>

        <DimensionsInput
          dimensions={dimensions}
          onChange={setDimensions}
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Save Dimensions'}
          </button>
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDimensionsModal;