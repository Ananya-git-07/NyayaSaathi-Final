// PASTE THIS ENTIRE FILE INTO src/components/GenerateDocumentModal.jsx

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, Download, Loader2, AlertCircle, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "../api/axiosConfig"
import { useNavigate } from "react-router-dom"

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

const GenerateDocumentModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [docType, setDocType] = useState("AI Draft") // Default to AI
  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    village: "",
    district: "",
    issueType: "Legal Notice",
    description: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    const toastId = toast.loading(docType === 'AI Draft' ? "AI is drafting your document..." : "Generating document...")

    try {
      const response = await apiClient.post(
        "/documents/generate",
        {
          type: docType,
          data: formData,
        },
        {
          responseType: "blob", 
        }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${docType.replace(/\s/g, '_')}_${Date.now()}.pdf`)
      document.body.appendChild(link)
      link.click()
      
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url) 

      toast.success("Document generated successfully!", { id: toastId })
      onClose()
    } catch (error) {
      console.error("Generation Error:", error)
      if (error.response && error.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
              try {
                  const errorData = JSON.parse(reader.result);
                  if (error.response.status === 402) {
                      toast.error("Premium Feature: Please upgrade your plan.", { id: toastId });
                      onClose();
                      navigate("/pricing"); 
                  } else {
                      toast.error(errorData.message || "Failed to generate document.", { id: toastId });
                  }
              } catch (e) {
                  toast.error("An error occurred while generating.", { id: toastId });
              }
          };
          reader.readAsText(error.response.data);
      } else {
          toast.error("Network error or server unavailable.", { id: toastId });
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <FileText className="text-indigo-600 dark:text-indigo-400" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Generate Document</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              {/* Document Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="input-style"
                >
                  <option value="AI Draft">✨ AI Auto-Draft (Universal)</option>
                  <option value="Affidavit">Affidavit (Template)</option>
                  <option value="Complaint">Official Complaint (Template)</option>
                  <option value="Caste Certificate">Caste Certificate (Application)</option>
                </select>
              </div>

              {/* Dynamic Hint for AI */}
              {docType === 'AI Draft' && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg flex items-start gap-3 border border-indigo-200 dark:border-indigo-800">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      <strong>AI Mode:</strong> Just describe what you need in the "Detailed Description" box. The AI will format the legal language for you.
                    </p>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input name="fullName" value={formData.fullName} onChange={handleChange} required className="input-style" placeholder="Rahul Kumar" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Father's Name</label>
                  <input name="fatherName" value={formData.fatherName} onChange={handleChange} required className="input-style" placeholder="Mohan Kumar" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Village/Town</label>
                  <input name="village" value={formData.village} onChange={handleChange} required className="input-style" placeholder="Rampur" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">District</label>
                  <input name="district" value={formData.district} onChange={handleChange} required className="input-style" placeholder="Mathura" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {docType === 'AI Draft' ? "Document Subject / Purpose" : "Issue Subject"}
                </label>
                <input name="issueType" value={formData.issueType} onChange={handleChange} required className="input-style" placeholder="e.g., Request for Electricity Meter" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Detailed Description</label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="input-style resize-none"
                  placeholder={docType === 'AI Draft' ? "Explain your situation clearly. The AI will use this to write the main content." : "Explain the facts of the case here..."}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-primary flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  {isGenerating ? "Drafting & Generating..." : "Download PDF"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GenerateDocumentModal