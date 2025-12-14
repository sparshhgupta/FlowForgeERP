import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Plus, Trash2, Package, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const WorkersSection = ({
  workers,
  id,
  canEdit,
  onAddWorkerClick,
  fetchProjectDetails,
  getAuthHeader,
  API_URL,
  production
}) => {
  const [productWorkers, setProductWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedWorkers, setExpandedWorkers] = useState({});

  useEffect(() => {
    if (id && production && production.length > 0) {
      fetchProductWorkersForProject();
    }
  }, [id, production]);

  const fetchProductWorkersForProject = async () => {
    try {
      setLoading(true);
      
      // Fetch workers for all products in this project
      const workerPromises = production.map(product => 
        axios.get(
          `${API_URL}/products/production/${product.id}/workers`,
          { headers: getAuthHeader() }
        ).catch(error => {
          console.error(`Error fetching workers for product ${product.id}:`, error);
          return { data: [] }; // Return empty array on error
        })
      );

      const workerResults = await Promise.all(workerPromises);
      
      // Combine all workers from all products
      const allProductWorkers = [];
      workerResults.forEach((result, index) => {
        const product = production[index];
        result.data.forEach(assignment => {
          allProductWorkers.push({
            ...assignment,
            product_id: product.product_id,
            product_name: product.product_name,
            product_production_id: product.id
          });
        });
      });

      setProductWorkers(allProductWorkers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product workers for project:', error);
      setLoading(false);
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

  const handleRemoveFromProduct = async (workerId, productProductionId) => {
    if (!window.confirm('Remove this worker from this product?')) return;
    
    try {
      await axios.delete(
        `${API_URL}/products/production/${productProductionId}/workers/${workerId}`,
        { headers: getAuthHeader() }
      );
      // Refresh the product workers data
      fetchProductWorkersForProject();
      fetchProjectDetails(); // Also refresh main project data
    } catch (error) {
      alert('Failed to remove worker from product');
    }
  };

  const toggleExpandWorker = (workerId) => {
    setExpandedWorkers(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  // Group workers by worker_id to show their assignments
  const workersByWorker = productWorkers.reduce((acc, worker) => {
    if (!acc[worker.worker_id]) {
      acc[worker.worker_id] = {
        worker_id: worker.worker_id,
        worker_name: worker.worker_name,
        worker_phone: worker.worker_phone,
        attendance_status: worker.attendance_status,
        check_in_time: worker.check_in_time,
        assignments: []
      };
    }
    acc[worker.worker_id].assignments.push({
      product_id: worker.product_id,
      product_name: worker.product_name,
      product_production_id: worker.product_production_id,
      assignment_id: worker.id
    });
    return acc;
  }, {});

  // Get all unique workers assigned to products
  const assignedWorkers = Object.values(workersByWorker);

  // Get workers not assigned to any product today (from permanent team)
  const unassignedWorkers = workers.filter(worker => 
    !assignedWorkers.some(aw => aw.worker_id === worker.id)
  );

  return (
    <>
        {/* Product Assignments Summary */}
      {assignedWorkers.length > 0 && (
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="text-purple-400" size={20} />
              Assignments by Product
            </h3>
          </div>
          
          <div className="space-y-3">
            {production.map(product => {
              const productWorkersCount = productWorkers.filter(w => 
                w.product_production_id === product.id
              ).length;
              
              if (productWorkersCount === 0) return null;
              
              return (
                <div key={product.id} className="bg-slate-900 bg-opacity-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium text-sm">{product.product_name}</h4>
                      <span className="px-2 py-0.5 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-xs">
                        {productWorkersCount} worker{productWorkersCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 ml-2">
                    {productWorkers
                      .filter(w => w.product_production_id === product.id)
                      .map((worker, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300">{worker.worker_name}</span>
                            {worker.attendance_status && (
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                worker.attendance_status === 'present' 
                                  ? 'bg-green-500 text-green-100'
                                  : worker.attendance_status === 'half-day'
                                  ? 'bg-yellow-500 text-yellow-100'
                                  : 'bg-red-500 text-red-100'
                              }`}>
                                {worker.attendance_status}
                              </span>
                            )}
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleRemoveFromProduct(worker.worker_id, product.id)}
                              className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded"
                              title="Remove from this product"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Product Workers Section */}
      <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="text-blue-400" size={24} />
            Product Workers
          </h2>
          {loading && (
            <span className="text-xs text-slate-400">Loading...</span>
          )}
        </div>

        {assignedWorkers.length === 0 ? (
          <div className="text-center py-8">
            <Package className="text-slate-600 mx-auto mb-3" size={48} />
            <p className="text-slate-400 mb-2">No workers assigned to products</p>
            <p className="text-slate-500 text-sm">Assign workers to products from the production section</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedWorkers.map((worker) => {
              const isExpanded = expandedWorkers[worker.worker_id];
              
              return (
                <div
                  key={worker.worker_id}
                  className="bg-slate-900 bg-opacity-50 rounded-lg p-3 hover:bg-opacity-70 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{worker.worker_name}</p>
                          {worker.attendance_status && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              worker.attendance_status === 'present' 
                                ? 'bg-green-500 text-green-100'
                                : worker.attendance_status === 'half-day'
                                ? 'bg-yellow-500 text-yellow-100'
                                : 'bg-red-500 text-red-100'
                            }`}>
                              {worker.attendance_status}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleExpandWorker(worker.worker_id)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                      
                      {worker.worker_phone && (
                        <p className="text-xs text-slate-400 mb-2">{worker.worker_phone}</p>
                      )}
                      
                      {worker.check_in_time && (
                        <p className="text-xs text-slate-500 mb-2">Check-in: {worker.check_in_time.substring(0,5)}</p>
                      )}
                      
                      {/* Product Assignments (Collapsible) */}
                      <div className={`mt-2 ${isExpanded ? 'block' : 'hidden'}`}>
                        <p className="text-xs text-slate-500 mb-2">Assigned to:</p>
                        <div className="space-y-2">
                          {worker.assignments.map((assignment, index) => (
                            <div key={index} className="bg-slate-800 bg-opacity-50 rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Package size={12} className="text-blue-400" />
                                  <span className="text-slate-300 text-sm font-medium">
                                    {assignment.product_name}
                                  </span>
                                </div>
                                {canEdit && (
                                  <button
                                    onClick={() => handleRemoveFromProduct(
                                      worker.worker_id, 
                                      assignment.product_production_id
                                    )}
                                    className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded transition-colors"
                                    title="Remove from this product"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Simple count when collapsed */}
                      {!isExpanded && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer" 
                               onClick={() => toggleExpandWorker(worker.worker_id)}>
                            <Package size={10} className="text-blue-400" />
                            <span>Assigned to {worker.assignments.length} product{worker.assignments.length !== 1 ? 's' : ''} (click to view)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permanent Team (Unassigned Workers) */}
      <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Available Team</h3>
          {canEdit && (
            <button
              onClick={onAddWorkerClick}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              Add Worker
            </button>
          )}
        </div>

        {unassignedWorkers.length === 0 ? (
          <p className="text-slate-400 text-center py-4 text-sm">All workers are assigned to products</p>
        ) : (
          <div className="space-y-2">
            {unassignedWorkers.map((worker) => (
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