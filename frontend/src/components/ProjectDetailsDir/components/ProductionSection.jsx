import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit, Eye, Ruler, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ProductionSection = ({ 
  production, 
  canEdit, 
  onAddProduct, 
  fetchProjectDetails,
  onEditDisplay,
  onEditDimensions,
  onWorkersClick  // New prop
}) => {
  const [editingProduction, setEditingProduction] = useState(null);
  const { getAuthHeader, API_URL, user } = useAuth();
  const [editValue, setEditValue] = useState({ 
    quantity: '',
    target: '',
    workers: '',
    displayQuantity: '',
    displayTarget: ''
  });

  const handleUpdateProduction = async (productionId) => {
    try {
      const updateData = {};
      if (editValue.quantity !== '') updateData.quantity_produced = parseInt(editValue.quantity);
      if (editValue.workers !== '') updateData.assigned_workers = parseInt(editValue.workers);
      if(editValue.target !== '') updateData.target_quantity = parseInt(editValue.target);
      
      if (editValue.displayQuantity !== '' && editValue.displayQuantity !== editValue.quantity) {
        updateData.display_quantity_produced = parseInt(editValue.displayQuantity);
      } else if (editValue.displayQuantity === '') {
        updateData.display_quantity_produced = null;
      }
      
      if (editValue.displayTarget !== '') {
        updateData.display_target_quantity = parseInt(editValue.displayTarget);
      } else {
        updateData.display_target_quantity = null;
      }

      await axios.put(
        `${API_URL}/products/production/${productionId}`,
        updateData,
        { headers: getAuthHeader() }
      );
      setEditingProduction(null);
      setEditValue({ quantity: '', target:'', workers: '', displayQuantity: '', displayTarget: '' });
      fetchProjectDetails();
    } catch (error) {
      alert('Failed to update production');
    }
  };

  const handleRemoveProduct = async (productionId) => {
    if (!window.confirm('Remove this product from project?')) return;
    
    try {
      await axios.delete(
        `${API_URL}/products/production/${productionId}`,
        { headers: getAuthHeader() }
      );
      fetchProjectDetails();
    } catch (error) {
      alert('Failed to remove product');
    }
  };

  const chartData = production.map((item) => ({
    name: item.product_name,
    value: parseInt(item.quantity_produced),
  }));

  return (
    <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="text-blue-400" size={24} />
          <h2 className="text-2xl font-bold text-white">Production</h2>
        </div>
        {canEdit && (
          <button
            onClick={onAddProduct}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            Add Product
          </button>
        )}
      </div>

      {production.length === 0 ? (
        <div className="text-center py-12">
          <Package className="text-slate-600 mx-auto mb-3" size={48} />
          <p className="text-slate-400 mb-4">No products added yet</p>
          {canEdit && (
            <button
              onClick={onAddProduct}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {production.map((item) => (
              <ProductionItem
                key={item.id}
                item={item}
                editingProduction={editingProduction}
                editValue={editValue}
                canEdit={canEdit}
                user={user}
                onEditClick={() => {
                  setEditingProduction(item.id);
                  setEditValue({ 
                    quantity: item.quantity_produced, 
                    workers: item.assigned_workers || 0,
                    target: item.target_quantity,
                  });
                }}
                onSave={() => handleUpdateProduction(item.id)}
                onCancel={() => {
                  setEditingProduction(null);
                  setEditValue({ quantity: '', target: '', workers: '' });
                }}
                onRemove={() => handleRemoveProduct(item.id)}
                onDisplayClick={() => onEditDisplay(item)}
                onDimensionsClick={() => onEditDimensions(item)}
                onWorkersClick={() => onWorkersClick(item)}  // New prop
                onEditValueChange={setEditValue}
              />
            ))}
          </div>

          {chartData.some(d => d.value > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Production Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ProductionItem = ({ 
  item, 
  editingProduction, 
  editValue, 
  canEdit, 
  user, 
  onEditClick, 
  onSave, 
  onCancel, 
  onRemove, 
  onDisplayClick,
  onDimensionsClick,
  onWorkersClick,  // New prop
  onEditValueChange
}) => {
  // Parse dimensions
  const parseDimensions = (dimensions) => {
    if (!dimensions) return null;
    try {
      return typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
    } catch {
      return null;
    }
  };

  const dimensions = parseDimensions(item.dimensions);

  if (editingProduction === item.id && canEdit) {
    return (
      <div className="bg-slate-900 bg-opacity-50 rounded-lg p-4 border border-slate-700">
        <div className="space-y-2 bg-slate-800 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-blue-300 uppercase">Actual Values</p>
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-xs w-20">Quantity:</label>
                <input
                  type="number"
                  value={editValue.quantity}
                  onChange={(e) => onEditValueChange({...editValue, quantity: e.target.value})}
                  placeholder={item.quantity_produced}
                  className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-xs w-20">Target:</label>
                <input
                  type="number"
                  value={editValue.target}
                  onChange={(e) => onEditValueChange({...editValue, target: e.target.value})}
                  placeholder={item.target_quantity}
                  className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-xs w-20">Workers:</label>
                <input
                  type="number"
                  value={editValue.workers}
                  onChange={(e) => onEditValueChange({...editValue, workers: e.target.value})}
                  placeholder={item.assigned_workers || 0}
                  className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 border-l border-slate-700 pl-3">
              <p className="text-xs font-semibold text-green-300 uppercase">Client View</p>
              <div className="text-xs text-slate-400 space-y-1">
                <div>Quantity: {item.display_quantity || item.quantity_produced}</div>
                <div>Target: {item.display_target || item.target_quantity}</div>
                <div>Progress: {item.display_completion_percentage}%</div>
              </div>
              {user?.role === 'owner' && (
                <button
                  onClick={onDisplayClick}
                  className="w-full py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                >
                  Configure Display
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex-1"
            >
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 bg-opacity-50 rounded-lg p-4 border border-slate-700">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">{item.product_name}</h4>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-sm font-medium">
                {item.completion_percentage}% actual
              </span>
              {(item.display_quantity_produced || item.display_target_quantity) && (
                <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded-full text-sm font-medium">
                  {item.display_completion_percentage}% shown
                </span>
              )}
              {canEdit && user?.role === 'owner' && (
                <button
                  onClick={onRemove}
                  className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-400 capitalize">{item.product_type}</p>
          
          {/* Display Dimensions */}
          {dimensions && Object.keys(dimensions).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(dimensions).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300"
                >
                  <Ruler size={12} className="text-yellow-400" />
                  <span className="font-medium text-yellow-400">{key}:</span>
                  <span>{value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-slate-300 text-sm">
                Actual: {item.quantity_produced} / {item.target_quantity} {item.product_unit}
              </span>
              {(item.display_quantity_produced || item.display_target_quantity) && (
                <span className="text-green-300 text-sm">
                  Client sees: {item.display_quantity} / {item.display_target} {item.product_unit}
                </span>
              )}
            </div>
            <div 
              className={`text-xs ${item.assigned_workers_count > 0 ? 'cursor-pointer hover:text-blue-300' : 'text-slate-400'} transition-colors`}
              onClick={item.assigned_workers_count > 0 ? () => onWorkersClick(item) : undefined}
              title={item.assigned_workers_count > 0 ? "Click to view/assign workers" : "No workers assigned"}
            >
              <div className="flex items-center gap-1">
                <Users size={12} className={item.assigned_workers_count > 0 ? "text-blue-400" : "text-slate-500"} />
                Workers assigned: {item.assigned_workers_count || 0}
                {item.assigned_workers_count > 0 && ' (click to view)'}
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-1">
              <button
                onClick={onEditClick}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                title="Edit production"
              >
                <Edit className="text-slate-400" size={16} />
              </button>
              {user?.role === 'owner' && (
                <>
                  <button
                    onClick={onDisplayClick}
                    className="p-1 hover:bg-green-600 hover:bg-opacity-20 rounded transition-colors"
                    title="Configure client display"
                  >
                    <Eye className="text-green-400" size={16} />
                  </button>
                  <button
                    onClick={onDimensionsClick}
                    className="p-1 hover:bg-yellow-600 hover:bg-opacity-20 rounded transition-colors"
                    title="Edit dimensions"
                  >
                    <Ruler className="text-yellow-400" size={16} />
                  </button>
                </>
              )}
              <button
                onClick={() => onWorkersClick(item)}
                className="p-1 hover:bg-blue-600 hover:bg-opacity-20 rounded transition-colors"
                title="Assign workers to this product"
              >
                <Users className="text-blue-400" size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400">Actual Progress</span>
              <span className="text-xs text-blue-300">{item.completion_percentage}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(item.completion_percentage, 100)}%` }}
              />
            </div>
          </div>

          {(item.display_quantity_produced || item.display_target_quantity) && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Client View</span>
                <span className="text-xs text-green-300">{item.display_completion_percentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.display_completion_percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionSection;