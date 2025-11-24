import { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

const ReviewParalegalRequestModal = ({ isOpen, onClose, request, onSuccess }) => {
  const [adminResponse, setAdminResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const handleReview = async (status) => {
    if (status === 'rejected' && !adminResponse.trim()) {
      return toast.error('Please provide a reason for rejection');
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`${status === 'approved' ? 'Approving' : 'Rejecting'} request...`);

    try {
      const response = await apiClient.put(`/paralegal-requests/${request._id}`, {
        status,
        adminResponse: adminResponse.trim()
      });

      if (response.data.success) {
        toast.success(`Request ${status} successfully!`, { id: toastId });
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} request.`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Review Paralegal Request
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Applicant Information</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {request.user?.fullName}</p>
                <p><strong>Email:</strong> {request.user?.email}</p>
                <p><strong>Aadhaar:</strong> {request.user?.aadhaarNumber}</p>
                <p><strong>Phone:</strong> {request.phoneNumber}</p>
                <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Areas of Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {request.areasOfExpertise.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 rounded-full text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {request.requestMessage && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Applicant's Message</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">{request.requestMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Admin Response {request.status === 'pending' && '(Required for rejection)'}
              </label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Provide feedback or reason..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                disabled={isSubmitting || request.status !== 'pending'}
              />
            </div>
          </div>

          {request.status === 'pending' ? (
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleReview('rejected')}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleReview('approved')}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle size={16} />
                )}
                <span>Approve</span>
              </button>
            </div>
          ) : (
            <div className={`p-4 rounded-lg ${
              request.status === 'approved' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              <p className="font-semibold">
                This request has been {request.status}
              </p>
              {request.adminResponse && (
                <p className="text-sm mt-2">Response: {request.adminResponse}</p>
              )}
              {request.reviewedBy && (
                <p className="text-sm mt-1">
                  Reviewed by: {request.reviewedBy.fullName} on {new Date(request.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewParalegalRequestModal;
