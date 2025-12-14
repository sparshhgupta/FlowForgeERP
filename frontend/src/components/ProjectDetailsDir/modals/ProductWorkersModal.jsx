import React, { useState, useEffect } from 'react';
import { Users, X, UserPlus, UserMinus, Search, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ProductWorkersModal = ({ 
  isOpen, 
  onClose, 
  product, 
  projectId,
  getAuthHeader, 
  API_URL,
  fetchProjectDetails,
  unassignedAvailableWorkers
}) => {
  const [productWorkers, setProductWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [availableWorkers, setAvailableWorkers] = useState([]);

  useEffect(() => {
    if (isOpen && product) {
      fetchProductWorkers();
      fetchSimpleAvailableWorkers();
    }
  }, [isOpen, product]);

  const fetchProductWorkers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `${API_URL}/products/production/${product.id}/workers`,
        { headers: getAuthHeader() }
      );
      setProductWorkers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product workers:', error);
      setError('Failed to load workers. Please try again.');
      setLoading(false);
    }
  };

  const fetchSimpleAvailableWorkers = async () => {
    try {
      // Get all workers who are present today
      const response = await axios.get(
        `${API_URL}/attendance/today/details`,
        { headers: getAuthHeader() }
      );
      
      // Filter for present/half-day workers and simplify the data
      const presentWorkers = response.data
        .filter(w => w.status === 'present' || w.status === 'half-day')
        .map(w => ({
          id: w.id,
          name: w.name,
          phone: w.phone,
          status: w.status,
          check_in_time: w.check_in_time
        }));
      
      setAvailableWorkers(presentWorkers);
    } catch (error) {
      console.error('Error fetching available workers:', error);
      // Use the unassignedAvailableWorkers prop as fallback
      setAvailableWorkers(unassignedAvailableWorkers);
    }
  };

  const handleAssignWorker = async (workerId) => {
    try {
      setError('');
      console.log('Assigning worker:', workerId, 'to product:', product.id);
      
      const response = await axios.post(
        `${API_URL}/products/production/${product.id}/workers`,
        { worker_id: workerId },
        { headers: getAuthHeader() }
      );
      
      console.log('Assignment successful:', response.data);
      
      // Refresh data
      fetchProductWorkers();
      fetchProjectDetails(); // Refresh the main project data
      fetchSimpleAvailableWorkers(); // Refresh available workers
    } catch (error) {
      console.error('Error assigning worker:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to assign worker. Please try again.');
    }
  };

  const handleRemoveWorker = async (workerId) => {
    if (!window.confirm('Remove this worker from this product?')) return;
    
    try {
      setError('');
      await axios.delete(
        `${API_URL}/products/production/${product.id}/workers/${workerId}`,
        { headers: getAuthHeader() }
      );
      
      // Refresh data
      fetchProductWorkers();
      fetchProjectDetails(); // Refresh the main project data
      fetchSimpleAvailableWorkers(); // Refresh available workers
    } catch (error) {
      console.error('Error removing worker:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to remove worker. Please try again.');
    }
  };

  // Filter workers who are not already assigned to this product
  const filteredAvailableWorkers = availableWorkers.filter(worker =>
    (worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.phone?.includes(searchTerm)) &&
    !productWorkers.some(pw => pw.worker_id === worker.id)
  );

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="text-blue-400" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white">{product.product_name} - Worker Assignment</h2>
                <p className="text-sm text-slate-400">
                  Currently assigned: {productWorkers.length} worker{productWorkers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="text-slate-400" size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Error Message */}
          {error && (
            <div className="m-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Currently Assigned Workers */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Currently Assigned Workers</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="text-slate-400">Loading...</div>
              </div>
            ) : productWorkers.length === 0 ? (
              <div className="text-center py-6">
                <Users className="text-slate-600 mx-auto mb-3" size={48} />
                <p className="text-slate-400">No workers assigned to this product today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {productWorkers.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-slate-900 bg-opacity-50 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{assignment.worker_name}</p>
                        {assignment.attendance_status && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            assignment.attendance_status === 'present' 
                              ? 'bg-green-500 text-green-100'
                              : assignment.attendance_status === 'half-day'
                              ? 'bg-yellow-500 text-yellow-100'
                              : 'bg-red-500 text-red-100'
                          }`}>
                            {assignment.attendance_status}
                          </span>
                        )}
                      </div>
                      {assignment.worker_phone && (
                        <p className="text-xs text-slate-400 mb-1">{assignment.worker_phone}</p>
                      )}
                      {assignment.check_in_time && (
                        <p className="text-xs text-slate-500">Check-in: {assignment.check_in_time.substring(0,5)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveWorker(assignment.worker_id)}
                      className="p-2 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded transition-colors"
                      title="Remove from product"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Workers */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Assign Available Workers</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search workers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm"
                />
              </div>
            </div>

            {filteredAvailableWorkers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 mb-2">No available workers found</p>
                <p className="text-slate-500 text-sm">
                  {searchTerm ? 'Try a different search term' : 'All present workers are already assigned to this product'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAvailableWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-slate-900 bg-opacity-50 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{worker.name}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          worker.status === 'present' 
                            ? 'bg-green-500 text-green-100'
                            : worker.status === 'half-day'
                            ? 'bg-yellow-500 text-yellow-100'
                            : 'bg-red-500 text-red-100'
                        }`}>
                          {worker.status}
                        </span>
                      </div>
                      {worker.phone && (
                        <p className="text-xs text-slate-400 mb-1">{worker.phone}</p>
                      )}
                      {worker.check_in_time && (
                        <p className="text-xs text-slate-500">Check-in: {worker.check_in_time.substring(0,5)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAssignWorker(worker.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
                      title="Assign to this product"
                    >
                      <UserPlus size={14} />
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
              Note: Only workers marked as 'present' or 'half-day' today can be assigned
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductWorkersModal;