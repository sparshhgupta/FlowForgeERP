import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import DimensionsInput from './DimensionsInput';

const AddProductModal = ({ 
  isOpen, 
  onClose, 
  availableProducts, 
  id, 
  getAuthHeader, 
  API_URL, 
  fetchProjectDetails 
}) => {
  const [productForm, setProductForm] = useState({ 
    product_id: '', 
    target_quantity: '',
    dimensions: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddProduct = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        product_id: parseInt(productForm.product_id),
        target_quantity: parseInt(productForm.target_quantity),
        dimensions: Object.keys(productForm.dimensions).length > 0 
          ? productForm.dimensions 
          : null
      };

      console.log('Sending request to:', `${API_URL}/projects/${id}/products`);
      console.log('Payload:', payload);

      const response = await axios.post(
        `${API_URL}/projects/${id}/products`,
        payload,
        { headers: getAuthHeader() }
      );

      console.log('Response:', response.data);

      onClose();
      setProductForm({ product_id: '', target_quantity: '', dimensions: {} });
      fetchProjectDetails();
    } catch (error) {
      console.error('Error adding product:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleDimensionsChange = (newDimensions) => {
    setProductForm({ ...productForm, dimensions: newDimensions });
  };

  const handleClose = () => {
    setProductForm({ product_id: '', target_quantity: '', dimensions: {} });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Add Product</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {availableProducts.length === 0 ? (
          <p className="text-slate-400 text-center py-4">All products already added</p>
        ) : (
          <>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-slate-300 mb-2 text-sm">Product *</label>
                <select
                  value={productForm.product_id}
                  onChange={(e) => setProductForm({...productForm, product_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Select product...</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm">Target Quantity *</label>
                <input
                  type="number"
                  value={productForm.target_quantity}
                  onChange={(e) => setProductForm({...productForm, target_quantity: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 1000"
                  disabled={loading}
                />
              </div>

              <DimensionsInput
                dimensions={productForm.dimensions}
                onChange={handleDimensionsChange}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddProduct}
                disabled={!productForm.product_id || !productForm.target_quantity || loading}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddProductModal;