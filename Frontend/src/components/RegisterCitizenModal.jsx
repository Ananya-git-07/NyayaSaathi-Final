// PASTE THIS ENTIRE FILE INTO src/components/RegisterCitizenModal.jsx

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, UserPlus, Loader2, CreditCard, User, Phone, Lock } from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "../api/axiosConfig"

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

const RegisterCitizenModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    aadhaarNumber: "",
    phoneNumber: "",
    password: "Password@123" // Default temporary password
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const loadingToast = toast.loading("Registering citizen...")

    try {
      await apiClient.post("/auth/kiosk-register-citizen", formData)
      toast.success("Citizen registered successfully!", { id: loadingToast })
      toast.success(`Temp Password: ${formData.password}`, { duration: 6000 }) // Show temp password
      onSuccess()
      setFormData({ fullName: "", aadhaarNumber: "", phoneNumber: "", password: "Password@123" })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.", { id: loadingToast })
    } finally {
      setIsSubmitting(false)
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
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <UserPlus className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Register Citizen</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input name="fullName" value={formData.fullName} onChange={handleChange} required className="input-style pl-10" placeholder="Ramesh Kumar" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aadhaar Number</label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} required maxLength="12" pattern="\d{12}" className="input-style pl-10" placeholder="12 Digit Number" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="input-style pl-10" placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Set Temp Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input name="password" value={formData.password} onChange={handleChange} required className="input-style pl-10" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                  Register
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RegisterCitizenModal