"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, AlertCircle, Mic } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "../api/axiosConfig"
import { aiService } from "../services/aiService" // <-- Import the new service

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const AddIssueModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ issueType: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)

  const issueTypes = ["Aadhaar Issue", "Pension Issue", "Land Dispute", "Court Summon", "Certificate Missing", "Fraud Case", "Other"];

  // Setup speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const parsedData = aiService.parseFormDataFromText(transcript);
      
      if (parsedData.issueType) {
        // Find the correctly cased enum value
        const matchedType = issueTypes.find(t => t.toLowerCase() === parsedData.issueType.toLowerCase()) || "Other";
        setFormData(prev => ({ ...prev, issueType: matchedType }));
      }
      if (parsedData.description) {
        setFormData(prev => ({ ...prev, description: parsedData.description }));
      }
      toast.success("Form filled with your voice command.");
    };

    recognition.onerror = (event) => toast.error(`Mic error: ${event.error}`);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, []);

  const handleVoiceCommand = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.issueType || !formData.description.trim()) {
      return toast.error("Issue type and description are required.");
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating new issue...");
    try {
      await apiClient.post("/issues", formData);
      toast.success("Legal issue created successfully!", { id: loadingToast });
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create issue.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ issueType: "", description: "" });
    if (isRecording) recognitionRef.current?.stop();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Report a New Legal Issue</h3>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="issueType" className="block text-sm font-medium text-slate-700 mb-2">Issue Type *</label>
                  <select id="issueType" name="issueType" value={formData.issueType} onChange={handleChange} className="input-style" required>
                    <option value="" disabled>Select an issue type</option>
                    {issueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                  <textarea id="description" name="description" rows="5" value={formData.description} onChange={handleChange} placeholder="Describe your issue in detail. You can also use the voice command button." className="input-style w-full resize-none" required/>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                <button type="button" onClick={handleVoiceCommand} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                  <Mic size={16} />
                  {isRecording ? "Listening..." : "Fill with Voice"}
                </button>
                <div className="flex gap-3">
                    <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        {isSubmitting ? "Submitting..." : "Submit Issue"}
                    </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddIssueModal;