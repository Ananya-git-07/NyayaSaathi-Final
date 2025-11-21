// PASTE THIS ENTIRE FILE INTO src/components/AssignParalegalModal.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCheck, Search, Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axiosConfig';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const AssignParalegalModal = ({ isOpen, onClose, issueId, onSuccess }) => {
  const [paralegals, setParalegals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        fetchParalegals();
    }
  }, [isOpen]);

  const fetchParalegals = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/paralegals');
      setParalegals(response.data);
    } catch (error) {
      toast.error("Failed to load paralegals.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedId) return toast.error("Please select a paralegal.");
    
    setIsSubmitting(true);
    const loadingToast = toast.loading("Assigning case...");
    
    try {
        await apiClient.patch(`/issues/${issueId}/assign`, { paralegalId: selectedId });
        toast.success("Paralegal assigned successfully!", { id: loadingToast });
        onSuccess();
        onClose();
    } catch (error) {
        toast.error(error.response?.data?.message || "Assignment failed.", { id: loadingToast });
    } finally {
        setIsSubmitting(false);
    }
  };

  const filteredParalegals = paralegals.filter(p => 
    p.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.areasOfExpertise?.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assign Paralegal</h3>
              <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><X /></button>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or expertise..." 
                        className="input-style pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                    <div className="text-center py-8"><Spinner size={24} /></div>
                ) : filteredParalegals.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No paralegals found.</p>
                ) : (
                    filteredParalegals.map(p => (
                        <div 
                            key={p._id}
                            onClick={() => setSelectedId(p._id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedId === p._id ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'}`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{p.user?.fullName}</p>
                                    <div className="flex gap-1 text-xs text-slate-500 mt-1">
                                        {p.areasOfExpertise?.map(area => (
                                            <span key={area} className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{area}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-500 font-medium">
                                    <Star size={14} fill="currentColor" /> {p.rating}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button onClick={handleAssign} disabled={!selectedId || isSubmitting} className="btn-primary flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
                    Assign Selected
                </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Spinner = ({ size = 24 }) => <Loader2 className="animate-spin text-cyan-600" size={size} />;

export default AssignParalegalModal;