"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, FileText, Calendar, User, ExternalLink, Download, Edit, Trash2, AlertCircle } from "lucide-react"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import toast from "react-hot-toast"

const DocumentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await apiClient.get(`/documents/${id}`)
        setDocument(response.data.data)
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch document details")
      } finally {
        setLoading(false)
      }
    }
    fetchDocument()
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this document?")) return

    const toastId = toast.loading("Deleting document...")
    try {
      await apiClient.delete(`/documents/${id}`)
      toast.success("Document deleted successfully", { id: toastId })
      navigate("/dashboard")
    } catch (err) {
      toast.error(`Failed to delete document: ${err.message}`, { id: toastId })
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted": return "bg-green-100 text-green-800 border-green-200"
      case "submitted": return "bg-blue-100 text-blue-800 border-blue-200"
      case "not_submitted": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "rejected": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) return <Spinner />
  if (error)
    return <div className="text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg text-center">{error}</div>
  if (!document)
    return (
      <div className="text-slate-600 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
        Document not found
      </div>
    )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="btn-secondary bg-red-50 text-red-600 hover:bg-red-100"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Document Details */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="text-blue-600" size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{document.documentType}</h1>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(document.submissionStatus)}`}
            >
              {document.submissionStatus.replace("_", " ").toUpperCase()}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Document Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="text-slate-500" size={16} />
                  <span className="text-slate-700">Uploaded: {new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-slate-500" size={16} />
                  <span className="text-slate-700">Uploaded by: {document.uploadedBy || 'User'}</span>
                </div>
              </div>
            </div>

            {document.userId && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">User Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="text-slate-500" size={16} />
                    <span className="text-slate-700">{document.userId.fullName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 ml-7">Email:</span>
                    <span className="text-slate-700">{document.userId.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {document.issueId && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Related Issue</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="text-orange-500" size={16} />
                  <span className="text-slate-900 font-medium">{document.issueId.issueType}</span>
                </div>
                <p className="text-slate-700 text-sm mb-2">{document.issueId.description}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">File Access</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 font-medium">Original Document</p>
                  <p className="text-slate-600 text-sm">Click to view or download the uploaded file.</p>
                </div>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <ExternalLink size={16} />
                  View Document
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default DocumentDetailPage