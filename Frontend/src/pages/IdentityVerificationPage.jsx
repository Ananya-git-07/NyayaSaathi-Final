// PASTE THIS ENTIRE FILE INTO src/pages/IdentityVerificationPage.jsx

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Upload, CheckCircle, XCircle, Loader2, ScanFace } from "lucide-react"
import apiClient from "../api/axiosConfig"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"

const IdentityVerificationPage = () => {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
      setResult(null) // Reset previous result
    }
  }

  const handleVerify = async () => {
    if (!file) return
    setIsAnalyzing(true)
    const toastId = toast.loading("Scanning ID Card...")

    try {
      const formData = new FormData()
      formData.append("idCard", file)

      const response = await apiClient.post("/ai/verify-identity", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      const verificationData = response.data.data
      setResult(verificationData)

      if (verificationData.verified) {
        toast.success("Identity Verified Successfully!", { id: toastId })
      } else {
        toast.error("Verification Failed: " + verificationData.reason, { id: toastId })
      }

    } catch (error) {
      toast.error("Verification Error. Please try clearer image.", { id: toastId })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-center gap-3">
            <ScanFace className="text-cyan-600" size={32} />
            Identity Verification (KYC)
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Upload your Aadhaar Card to verify your profile: <strong className="text-slate-900 dark:text-white">{user?.fullName}</strong>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          
          {/* Upload Area */}
          <div className="mb-8">
            <label 
              htmlFor="id-upload" 
              className={`relative block w-full aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                preview ? 'border-cyan-500' : 'border-slate-300 dark:border-slate-600 hover:border-cyan-400'
              }`}
            >
              {preview ? (
                <img src={preview} alt="ID Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="text-slate-400" size={32} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Click to upload Aadhaar Card</p>
                  <p className="text-sm text-slate-400 mt-1">JPG, PNG only</p>
                </div>
              )}
              <input id="id-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Action Button */}
          <button
            onClick={handleVerify}
            disabled={!file || isAnalyzing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isAnalyzing 
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "btn-primary"
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" /> Analyzing ID...
              </>
            ) : (
              <>
                <Shield size={20} /> Verify Identity
              </>
            )}
          </button>

          {/* Results Area */}
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-8 p-6 rounded-xl border ${
                result.verified 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${result.verified ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {result.verified ? <CheckCircle size={32} /> : <XCircle size={32} />}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${result.verified ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
                    {result.verified ? "Verification Successful" : "Verification Failed"}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                    <strong>AI Analysis:</strong> {result.reason}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/50 dark:bg-black/20 p-3 rounded">
                      <span className="block text-xs text-slate-500 uppercase">Extracted Name</span>
                      <span className="font-mono font-semibold">{result.extractedName || "N/A"}</span>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-3 rounded">
                      <span className="block text-xs text-slate-500 uppercase">Extracted ID</span>
                      <span className="font-mono font-semibold">{result.extractedID || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}

export default IdentityVerificationPage