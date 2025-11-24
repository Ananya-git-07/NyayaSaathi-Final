import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, FileText, Calendar, User, ExternalLink, Trash2, AlertCircle, Sparkles, CheckCircle, Clock } from "lucide-react"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { summarizeLegalDocument } from "../services/legalKnowledgeService"
import ConfirmDialog from "../components/ConfirmDialog"
import { useConfirm } from "../hooks/useConfirm"

const DocumentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmState, confirm, closeDialog } = useConfirm()
  const { t } = useTranslation()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState(null)
  const [summarizing, setSummarizing] = useState(false)

  const handleOpenDocument = async (docId) => {
    const toastId = toast.loading("Loading document...")
    try {
      // Fetch the document with authentication headers
      const response = await apiClient.get(`/documents/${docId}/download`, {
        responseType: 'blob'
      })
      
      // Create a blob URL and open it in a new tab
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream'
      })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
      
      toast.success("Document opened", { id: toastId })
    } catch (err) {
      toast.error(`Failed to load document: ${err.response?.data?.message || err.message}`, { id: toastId })
    }
  }

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
    const confirmed = await confirm({
      title: "Delete Document?",
      message: "Are you sure you want to delete this document? The file will be permanently removed from the system.",
      type: "danger"
    });

    if (!confirmed) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        await apiClient.delete(`/documents/${id}`);
        resolve();
        navigate("/dashboard");
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(
      promise,
      {
        loading: 'Deleting document...',
        success: 'Document deleted successfully',
        error: (err) => `Failed to delete document: ${err.message}`,
      }
    );
  }

  const handleSummarize = async () => {
    if (!document.fileUrl) {
      toast.error("No document file available to summarize")
      return
    }

    setSummarizing(true)
    const toastId = toast.loading("Analyzing document with AI...")

    try {
      console.log('Document details for summarization:', {
        documentType: document.documentType,
        fileUrl: document.fileUrl,
        publicId: document.publicId,
        resourceType: document.resourceType,
        format: document.format
      });

      // Send document details to backend including publicId for Cloudinary API access
      const result = await summarizeLegalDocument(
        null, 
        document.documentType, 
        document.fileUrl,
        document.publicId,
        document.resourceType,
        document.format
      )

      if (result.success) {
        setSummary(result)
        toast.success("Document analyzed successfully!", { id: toastId })
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error("Summarization error:", err)
      toast.error(`Failed to analyze document: ${err.message}`, { id: toastId })
    } finally {
      setSummarizing(false)
    }
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"
      case "low": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
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
          <button 
            onClick={handleSummarize} 
            disabled={summarizing}
            className="btn-primary"
          >
            {summarizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>AI Summarize</span>
              </>
            )}
          </button>
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
                <button
                  onClick={() => handleOpenDocument(id)}
                  className="btn-primary"
                >
                  <ExternalLink size={16} />
                  {t('docDetail.viewDoc')}
                </button>
              </div>
            </div>
          </div>

          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-cyan-500" size={20} />
                  AI Document Analysis
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(summary.urgency)}`}>
                  {summary.urgency?.toUpperCase() || 'MEDIUM'} URGENCY
                </span>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-300 mb-2">Document Type</h4>
                  <p className="text-slate-700 dark:text-slate-300">{summary.documentType}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-300 mb-2">Summary</h4>
                  <p className="text-slate-700 dark:text-slate-300">{summary.summary}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-300 mb-2">Key Points</h4>
                  <ul className="space-y-2">
                    {summary.keyPoints?.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-300 mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {summary.recommendations?.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <ArrowLeft className="text-blue-500 flex-shrink-0 mt-0.5 rotate-180" size={16} />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {summary.nextSteps && (
                  <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-300 mb-2 flex items-center gap-2">
                      <Clock size={16} />
                      Next Steps
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">{summary.nextSteps}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeDialog}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
      />
    </motion.div>
  )
}

export default DocumentDetailPage