import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosConfig';

const EditIssueModal = ({ issue, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: issue.description || '',
    issueType: issue.issueType || ''
  });
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea to fit content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    // Adjust height on initial load
    adjustTextareaHeight();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Adjust height when description changes
    if (name === 'description') {
      setTimeout(() => adjustTextareaHeight(), 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Updating issue...');

    try {
      const response = await axiosInstance.put(`/issues/${issue._id}`, formData);
      toast.success('Issue updated successfully!', { id: toastId });
      onSuccess(response.data.data);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update issue';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Issue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Issue Type *
            </label>
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select issue type</option>
              <option value="Aadhaar Issue">Aadhaar Issue</option>
              <option value="Pension Issue">Pension Issue</option>
              <option value="Land Dispute">Land Dispute</option>
              <option value="Court Summon">Court Summon</option>
              <option value="Certificate Missing">Certificate Missing</option>
              <option value="Fraud Case">Fraud Case</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              ref={textareaRef}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none overflow-hidden"
              placeholder="Describe the issue in detail"
              style={{ minHeight: '100px' }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Updating...' : 'Update Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIssueModal;
