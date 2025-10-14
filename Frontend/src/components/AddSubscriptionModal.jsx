import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axiosConfig';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const AddSubscriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    organizationType: 'Kiosk', organizationRef: '', plan: 'Basic',
    amountPaid: '', expiryDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating subscription...');
    try {
      await apiClient.post('/subscriptions', formData);
      toast.success('Subscription created successfully!', { id: loadingToast });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create subscription.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ organizationType: 'Kiosk', organizationRef: '', plan: 'Basic', amountPaid: '', expiryDate: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">Create New Subscription</h3>
              <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <label className="block text-sm font-medium text-slate-300">Organization Type</label>
                <select name="organizationType" value={formData.organizationType} onChange={handleChange} className="input-style -mt-2">
                    <option value="Kiosk">Kiosk</option>
                    <option value="SHG">SHG</option>
                    <option value="Independent">Independent User</option>
                </select>

                <label className="block text-sm font-medium text-slate-300">Organization/User ID</label>
                <input name="organizationRef" placeholder="Enter the MongoDB ID of the Kiosk/User" onChange={handleChange} required className="input-style -mt-2" />

                <label className="block text-sm font-medium text-slate-300">Subscription Plan</label>
                <select name="plan" value={formData.plan} onChange={handleChange} className="input-style -mt-2">
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                </select>

                <label className="block text-sm font-medium text-slate-300">Amount Paid</label>
                <input name="amountPaid" type="number" placeholder="e.g., 500" onChange={handleChange} required className="input-style -mt-2" />

                <label className="block text-sm font-medium text-slate-300">Expiry Date</label>
                <input name="expiryDate" type="date" onChange={handleChange} required className="input-style -mt-2" />
              
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-auto flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin"/> : <Send/>}
                    Create Subscription
                    </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddSubscriptionModal;