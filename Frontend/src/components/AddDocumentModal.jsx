"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, UploadCloud, FileText, Mic } from "lucide-react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import apiClient from "../api/axiosConfig"
import { aiService } from "../services/aiService"

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const AddDocumentModal = ({ isOpen, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation()
  const [documentType, setDocumentType] = useState("")
  const [documentFile, setDocumentFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const parsedData = aiService.parseFormDataFromText(transcript);
      if (parsedData.documentType) {
        const formattedType = parsedData.documentType.charAt(0).toUpperCase() + parsedData.documentType.slice(1);
        setDocumentType(formattedType);
        toast.success("Document type filled with your voice command.");
      } else {
        toast.error("Could not recognize the document type. Please try again, saying 'document type is Aadhaar Card'.");
      }
    };

    recognition.onerror = (event) => toast.error(`Microphone error: ${event.error}`);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, [i18n.language]);

  const handleVoiceCommand = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        toast.error("Speech recognition is not available on this browser.");
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return toast.error("File size must be under 10MB.");
      }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        return toast.error("Only PDF, JPG, & PNG files are allowed.");
      }
      setDocumentFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentType.trim() || !documentFile) {
      return toast.error("Both document type and a file are required.");
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Uploading document...");
    
    const formData = new FormData();
    formData.append("documentType", documentType);
    formData.append("documentFile", documentFile);

    try {
      await apiClient.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Document uploaded successfully!", { id: loadingToast });
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload document.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDocumentType("");
    setDocumentFile(null);
    setFileName("");
    if (isRecording) {
      recognitionRef.current?.stop();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{t("addDocModal.title")}</h3>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("addDocModal.docTypeLabel")}</label>
                  <div className="flex items-center gap-2">
                    <input value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder={t("addDocModal.docTypePlaceholder")} required className="input-style flex-grow" />
                    <button type="button" onClick={handleVoiceCommand} className={`p-3 rounded-lg transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                      <Mic size={20} />
                    </button>
                  </div>
                   <p className="text-xs text-slate-500 mt-1">{t("addDocModal.voiceHint")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("addDocModal.docFileLabel")}</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-cyan-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-700 focus-within:outline-none">
                          <span>{t("addDocModal.uploadFile")}</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                        </label>
                        <p className="pl-1">{t("addDocModal.dragDrop")}</p>
                      </div>
                      <p className="text-xs text-slate-500">{t("addDocModal.fileTypes")}</p>
                      {fileName && <p className="text-sm text-green-600 mt-2 font-medium">{t("addDocModal.selectedFile", { fileName: fileName })}</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                <button type="button" onClick={handleClose} className="btn-secondary">{t("addDocModal.cancel")}</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {isSubmitting ? t("addDocModal.uploading") : t("addDocModal.upload")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddDocumentModal;