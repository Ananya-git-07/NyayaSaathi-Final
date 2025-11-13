import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, FileText, Calendar, User, ExternalLink, Trash2, AlertCircle } from "lucide-react"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const DocumentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      case "accepted": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
      case "submitted": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800"
      case "not_submitted": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"
      case "rejected": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
    }
  }

  if (loading) return <Spinner />
  if (error) return <div className="text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg text-center">{error}</div>
  if (!document) return <div className="text-slate-600 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">Document not found</div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft size={20} />
          {t('docDetail.back')}
        </button>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="btn-secondary bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900">
            <Trash2 size={16} />
            {t('docDetail.delete')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <FileText className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{document.documentType}</h1>
            <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(document.submissionStatus)}`}>
              {document.submissionStatus.replace("_", " ").toUpperCase()}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('docDetail.docInfo')}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="text-slate-500 dark:text-slate-400" size={16} />
                  <span className="text-slate-700 dark:text-slate-300">{t('docDetail.uploaded')}: {new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-slate-500 dark:text-slate-400" size={16} />
                  <span className="text-slate-700 dark:text-slate-300">{t('docDetail.uploadedBy')}: {document.uploadedBy || 'User'}</span>
                </div>
              </div>
            </div>

            {document.userId && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('docDetail.userInfo')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="text-slate-500 dark:text-slate-400" size={16} />
                    <span className="text-slate-700 dark:text-slate-300">{document.userId.fullName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 dark:text-slate-400 ml-7">{t('docDetail.email')}:</span>
                    <span className="text-slate-700 dark:text-slate-300">{document.userId.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {document.issueId && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('docDetail.relatedIssue')}</h3>
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="text-orange-500 dark:text-orange-400" size={16} />
                  <span className="text-slate-900 dark:text-white font-medium">{document.issueId.issueType}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">{document.issueId.description}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('docDetail.fileAccess')}</h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{t('docDetail.fileAccessDesc')}</p>
                </div>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <ExternalLink size={16} />
                  {t('docDetail.viewDoc')}
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