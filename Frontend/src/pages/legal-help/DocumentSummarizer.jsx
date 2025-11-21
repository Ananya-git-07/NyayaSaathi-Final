// PASTE THIS ENTIRE FILE INTO src/components/DocumentSummarizer.jsx

"use client"

import { useState } from "react"
import { FileText, Upload, Loader2, Download, Eye, AlertCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import GlassCard from "./GlassCard" // Ensure path is correct
import apiClient from "../api/axiosConfig"

const DocumentSummarizer = () => {
  const { i18n, t } = useTranslation() // Access translation
  const [file, setFile] = useState(null)
  const [text, setText] = useState("")
  const [result, setResult] = useState(null) // Stores { summary, keyPoints, recommendation }
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (uploadedFile) {
      if (uploadedFile.type === "application/pdf" || uploadedFile.type.startsWith("image/")) {
        setFile(uploadedFile)
        toast.success("File selected")
      } else {
        toast.error("Only PDF and Image files are accepted")
      }
    }
  }

  const summarizeDocument = async () => {
    if (!file && !text.trim()) {
      toast.error("Please upload a file or enter text")
      return
    }

    setIsProcessing(true)
    setResult(null)

    try {
      // Build FormData
      const formData = new FormData();
      if (text) formData.append("text", text);
      if (file) formData.append("document", file);
      formData.append("language", i18n.language); // 'en' or 'hi'

      // --- REAL API CALL ---
      const response = await apiClient.post("/ai/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setResult(response.data.data);
        toast.success("Summary generated successfully!");
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to generate summary. Try again.");
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {i18n.language === "hi" ? "दस्तावेज़ सारांशकर्ता" : "AI Document Simplifier"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {i18n.language === "hi" ? "जटिल कानूनी दस्तावेजों को सेकंडों में समझें" : "Understand complex legal documents in seconds"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-cyan-600 dark:text-cyan-400 mb-4">
            {i18n.language === "hi" ? "दस्तावेज़ अपलोड करें" : "Upload Document"}
          </h2>

          {/* File Upload */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors bg-slate-50 dark:bg-slate-800/50">
              <FileText className="mx-auto mb-4 text-slate-400" size={48} />
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                {i18n.language === "hi" ? "PDF या इमेज फाइल" : "Upload PDF or Image"}
              </p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="summ-file-upload"
              />
              <label
                htmlFor="summ-file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Upload size={16} />
                {i18n.language === "hi" ? "फाइल चुनें" : "Choose File"}
              </label>
              {file && (
                <p className="mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {i18n.language === "hi" ? "या टेक्स्ट पेस्ट करें" : "Or paste legal text"}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={i18n.language === "hi" ? "यहाँ अपना टेक्स्ट पेस्ट करें..." : "Paste the legal text content here..."}
              className="input-style w-full h-32 resize-none"
            />
          </div>

          <button
            onClick={summarizeDocument}
            disabled={isProcessing || (!file && !text.trim())}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {i18n.language === "hi" ? "विश्लेषण कर रहा है..." : "Analyzing..."}
              </>
            ) : (
              <>
                <Eye size={16} />
                {i18n.language === "hi" ? "सारांश बनाएं" : "Simplify Document"}
              </>
            )}
          </button>
        </GlassCard>

        {/* Output Section */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-cyan-600 dark:text-cyan-400 mb-4">
            {i18n.language === "hi" ? "परिणाम" : "Analysis Result"}
          </h2>

          {result ? (
            <div className="space-y-4">
              {/* Type Tag */}
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full text-xs font-bold">
                {result.documentType || "Document"}
              </div>

              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Summary</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{result.summary}</p>
              </div>

              {/* Key Points */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              {result.recommendation && (
                 <div className="flex gap-3 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="text-orange-600 dark:text-orange-400 flex-shrink-0" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300">Recommendation</h4>
                        <p className="text-xs text-orange-700 dark:text-orange-400">{result.recommendation}</p>
                    </div>
                 </div>
              )}

              <button
                onClick={() => {
                  const content = `Document Type: ${result.documentType}\n\nSummary:\n${result.summary}\n\nKey Points:\n${result.keyPoints.join('\n- ')}\n\nRecommendation:\n${result.recommendation}`;
                  const element = document.createElement("a")
                  const fileBlob = new Blob([content], { type: "text/plain" })
                  element.href = URL.createObjectURL(fileBlob)
                  element.download = "nyayasaathi-summary.txt"
                  document.body.appendChild(element)
                  element.click()
                  document.body.removeChild(element)
                }}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download Text
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>{i18n.language === "hi" ? "परिणाम यहाँ दिखाई देगा" : "Analysis will appear here"}</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

export default DocumentSummarizer