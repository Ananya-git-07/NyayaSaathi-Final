// PASTE THIS ENTIRE FILE INTO src/components/AddKioskModal.jsx

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

const AddKioskModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    location: '', village: '', district: '', operatorName: '',
    organizationType: 'Independent', organizationName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating kiosk...');
    try {
      await apiClient.post('/kiosks', formData);
      toast.success('Kiosk created successfully!', { id: loadingToast });
      onSuccess();
      handleClose(); // Use handleClose to reset form
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create kiosk.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ location: '', village: '', district: '', operatorName: '', organizationType: 'Independent', organizationName: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Kiosk</h3>
              <button onClick={handleClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="location" placeholder="Location (e.g., Main Street)" value={formData.location} onChange={handleChange} required className="input-style" />
              <input name="village" placeholder="Village/Town" value={formData.village} onChange={handleChange} required className="input-style" />
              <input name="district" placeholder="District" value={formData.district} onChange={handleChange} required className="input-style" />
              <input name="operatorName" placeholder="Operator Name" value={formData.operatorName} onChange={handleChange} required className="input-style" />
              <select name="organizationType" value={formData.organizationType} onChange={handleChange} className="input-style">
                <option value="NALSA">NALSA</option>
                <option value="DLSA">DLSA</option>
                <option value="SHG">SHG</option>
                <option value="CSR">CSR</option>
                <option value="NGO">NGO</option>
                <option value="Independent">Independent</option>
              </select>
              <input name="organizationName" placeholder="Organization Name (if applicable)" value={formData.organizationName} onChange={handleChange} className="input-style" />
              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-auto flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin"/> : <Send/>}
                  Create Kiosk
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddKioskModal;