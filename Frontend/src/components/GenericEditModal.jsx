import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axiosConfig';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// This is a single, reusable modal for editing any type of data.
const GenericEditModal = ({ isOpen, onClose, onSuccess, itemData, columns, endpoint, title }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Pre-fill form when itemData is available
    setFormData(itemData || {});
  }, [itemData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Handle booleans from checkboxes
    const newValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemData?._id) return toast.error("No item ID found to update.");

    setIsSubmitting(true);
    const loadingToast = toast.loading(`Updating ${title}...`);
    try {
      // Use the provided endpoint and item ID for the PUT request
      await apiClient.put(`${endpoint}/${itemData._id}`, formData);
      toast.success(`${title} updated successfully!`, { id: loadingToast });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || `Failed to update ${title}.`, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out columns that are not simple strings or booleans (i.e., computed values)
  const editableColumns = columns.filter(col => typeof col.accessor === 'string');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {editableColumns.map(col => {
                  const accessor = col.accessor;
                  const value = formData[accessor];

                  // Render a checkbox for boolean values
                  if (typeof value === 'boolean') {
                      return (
                          <div key={accessor} className="flex items-center gap-2">
                              <input id={accessor} name={accessor} type="checkbox" checked={value} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                              <label htmlFor={accessor} className="block text-sm font-medium text-slate-300">{col.header}</label>
                          </div>
                      );
                  }
                  
                  // Render a text input for other types
                  return (
                      <div key={accessor}>
                          <label htmlFor={accessor} className="block text-sm font-medium text-slate-300">{col.header}</label>
                          <input id={accessor} name={accessor} value={value || ''} placeholder={col.header} onChange={handleChange} className="input-style mt-1" />
                      </div>
                  )
              })}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary w-auto flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin"/> : <Send/>}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GenericEditModal;