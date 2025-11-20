import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

const AssignParalegalModal = ({ isOpen, onClose, issueId, currentAssignment, onAssignmentSuccess }) => {
  const [paralegals, setParalegals] = useState([]);
  const [selectedParalegal, setSelectedParalegal] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchParalegals();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchParalegals = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/paralegals');
      const activeParalegals = response.data.data.filter(p => p.active && !p.isDeleted);
      setParalegals(activeParalegals);
      
      // Pre-select current assignment if exists
      if (currentAssignment) {
        setSelectedParalegal(currentAssignment._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch paralegals');
      toast.error('Could not load paralegals');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedParalegal) {
      toast.error('Please select a paralegal');
      return;
    }

    setAssigning(true);
    try {
      const response = await apiClient.put(`/issues/${issueId}/assign`, {
        paralegalId: selectedParalegal
      });
      
      toast.success('Paralegal assigned successfully');
      if (onAssignmentSuccess) {
        onAssignmentSuccess(response.data.data);
      }
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to assign paralegal';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
              <UserPlus className="text-cyan-600 dark:text-cyan-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentAssignment ? 'Reassign Paralegal' : 'Assign Paralegal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          ) : paralegals.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                No active paralegals available
              </p>
            </div>
          ) : (
            <>
              {currentAssignment && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-blue-900 dark:text-blue-200 text-sm font-medium mb-1">
                    Currently Assigned:
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {currentAssignment.user?.fullName || 'Unknown'}
                  </p>
                  {currentAssignment.areasOfExpertise && (
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                      {currentAssignment.areasOfExpertise.join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Paralegal
                </label>
                <select
                  value={selectedParalegal}
                  onChange={(e) => setSelectedParalegal(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                           bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                           focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={assigning}
                >
                  <option value="">-- Choose a paralegal --</option>
                  {paralegals.map((paralegal) => (
                    <option key={paralegal._id} value={paralegal._id}>
                      {paralegal.user?.fullName || 'Unknown'} 
                      {paralegal.rating ? ` (⭐ ${paralegal.rating.toFixed(1)})` : ''}
                      {paralegal.areasOfExpertise?.length > 0 
                        ? ` - ${paralegal.areasOfExpertise.join(', ')}` 
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedParalegal && (
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  {(() => {
                    const selected = paralegals.find(p => p._id === selectedParalegal);
                    return selected ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {selected.user?.fullName}
                          </span>
                          {selected.rating && (
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">
                              ⭐ {selected.rating.toFixed(1)} / 5.0
                            </span>
                          )}
                        </div>
                        {selected.user?.email && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {selected.user.email}
                          </p>
                        )}
                        {selected.phoneNumber && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            📞 {selected.phoneNumber}
                          </p>
                        )}
                        {selected.areasOfExpertise && selected.areasOfExpertise.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selected.areasOfExpertise.map((area, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 
                                         text-xs rounded-full pointer-events-none select-none"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={assigning}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 
                     text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 
                     dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedParalegal || loading || paralegals.length === 0}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg 
                     hover:bg-cyan-700 transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                {currentAssignment ? 'Reassign' : 'Assign'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignParalegalModal;
