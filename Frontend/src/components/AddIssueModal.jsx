// PASTE THIS ENTIRE FILE INTO src/components/AddIssueModal.jsx

"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, AlertCircle, Mic } from "lucide-react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import apiClient from "../api/axiosConfig"
import { aiService } from "../services/aiService"

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const AddIssueModal = ({ isOpen, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation()
  const [formData, setFormData] = useState({ issueType: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)

  const issueTypes = ["Aadhaar Issue", "Pension Issue", "Land Dispute", "Court Summon", "Certificate Missing", "Fraud Case", "Other"];

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const parsedData = aiService.parseFormDataFromText(transcript);
      
      if (parsedData.issueType) {
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
  }, [i18n.language]);

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
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t("addIssueModal.title")}</h3>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="issueType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("addIssueModal.issueTypeLabel")}</label>
                  <select id="issueType" name="issueType" value={formData.issueType} onChange={handleChange} className="input-style" required>
                    <option value="" disabled>{t("addIssueModal.selectPlaceholder")}</option>
                    {issueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("addIssueModal.descriptionLabel")}</label>
                  <textarea id="description" name="description" rows="5" value={formData.description} onChange={handleChange} placeholder={t("addIssueModal.descriptionPlaceholder")} className="input-style w-full resize-none" required/>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl">
                <button type="button" onClick={handleVoiceCommand} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'}`}>
                  <Mic size={16} />
                  {isRecording ? t("addIssueModal.listening") : t("addIssueModal.fillWithVoice")}
                </button>
                <div className="flex gap-3">
                    <button type="button" onClick={handleClose} className="btn-secondary">{t("addIssueModal.cancel")}</button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        {isSubmitting ? t("addIssueModal.submitting") : t("addIssueModal.submit")}
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