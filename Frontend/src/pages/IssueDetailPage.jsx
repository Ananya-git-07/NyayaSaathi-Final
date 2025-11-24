import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft, AlertCircle, Calendar, User, FileText, Edit, Trash2, ExternalLink, List, CheckCircle, Upload, UserPlus, ChevronDown, Clock, MessageSquare
} from "lucide-react"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { useConfirm } from "../hooks/useConfirm"
import TimelineTracker from "../components/TimelineTracker"
import ChatWindow from "../components/ChatWindow"
import AssignParalegalModal from "../components/AssignParalegalModal"
import EditIssueModal from "../components/EditIssueModal"
import ConfirmDialog from "../components/ConfirmDialog"

const IssueDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { confirmState, confirm, closeDialog } = useConfirm()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (id) {
        const fetchIssue = async () => {
          try {
            const response = await apiClient.get(`/issues/${id}`)
            if (response.data.data.history) {
                response.data.data.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
            setIssue(response.data.data)
          } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch issue details")
          } finally {
            setLoading(false)
          }
        }
        fetchIssue()
    }
  }, [id])

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Issue?",
      message: "Are you sure you want to delete this issue? This action cannot be undone and all associated data will be permanently removed.",
      type: "danger"
    });

    if (!confirmed) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        await apiClient.delete(`/issues/${id}`);
        resolve();
        navigate("/dashboard");
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(
      promise,
      {
        loading: 'Deleting issue...',
        success: 'Issue deleted successfully',
        error: (err) => `Failed to delete issue: ${err.message}`,
      }
    );
  }

  const handleAssignmentSuccess = (updatedIssue) => {
    setIssue(updatedIssue);
    // Optionally refetch to ensure data is fresh
    window.location.reload(); // Simple approach to refresh all data including chat
  }

  const handleEditSuccess = (updatedIssue) => {
    setIssue(updatedIssue);
    setShowEditModal(false);
  }

  const handleStatusChange = async (newStatus) => {
    const toastId = toast.loading("Updating status...")
    try {
      const response = await apiClient.put(`/issues/${id}/status`, { status: newStatus })
      setIssue(response.data.data)
      toast.success("Status updated successfully", { id: toastId })
      setShowStatusDropdown(false)
    } catch (err) {
      toast.error(`Failed to update status: ${err.response?.data?.message || err.message}`, { id: toastId })
    }
  }

  const handleViewDocument = async (docId, docType, format) => {
    const toastId = toast.loading("Loading document...")
    try {
      // Fetch the document with authentication headers
      const response = await apiClient.get(`/documents/${docId}/download`, {
        responseType: 'blob'
      })
      
      // Create a blob URL and open it in a new tab
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 
              (format === 'pdf' ? 'application/pdf' : 
               ['png', 'jpg', 'jpeg'].includes(format) ? `image/${format}` : 'application/octet-stream')
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

  const canEdit = user && (user.role === 'admin' || issue?.userId?._id === user._id)

  const canAssign = user && (user.role === 'admin' || user.role === 'employee')

  const canChangeStatus = user && (user.role === 'admin' || user.role === 'paralegal' || user.role === 'employee')

  if (loading) return <Spinner />
  if (error) return <div>{error}</div>
  if (!issue) return <div>Issue not found</div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button and actions */}
        <div className="mb-6">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} /> {t('issueDetail.back')}
          </button>
          
          {/* Issue Header Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertCircle className="text-white" size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 break-words">{issue.issueType}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      issue.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      issue.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      issue.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {issue.status}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {canChangeStatus && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900 rounded-lg font-medium transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <CheckCircle size={16} /> 
                      Change Status
                      <ChevronDown size={14} />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-10">
                        {['pending', 'in-progress', 'resolved', 'closed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                              issue.status === status ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {canAssign && (
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 dark:bg-cyan-900/50 dark:text-cyan-400 dark:hover:bg-cyan-900 rounded-lg font-medium transition-colors border border-cyan-200 dark:border-cyan-800"
                  >
                    <UserPlus size={16} /> 
                    {issue.assignedParalegal ? 'Reassign' : 'Assign'}
                  </button>
                )}
                {canEdit && (
                  <>
                    <button 
                      onClick={() => setShowEditModal(true)} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors border border-slate-300 dark:border-slate-600"
                    >
                      <Edit size={16} /> {t('issueDetail.edit')}
                    </button>
                    <button 
                      onClick={handleDelete} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900 rounded-lg font-medium transition-colors border border-red-200 dark:border-red-800"
                    >
                      <Trash2 size={16} /> {t('issueDetail.delete')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Tab-based Layout */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 sm:flex-none px-6 py-4 font-semibold transition-all relative ${
                activeTab === 'details'
                  ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2 justify-center sm:justify-start">
                <FileText size={18} />
                Details
              </span>
              {activeTab === 'details' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 sm:flex-none px-6 py-4 font-semibold transition-all relative ${
                activeTab === 'timeline'
                  ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2 justify-center sm:justify-start">
                <Clock size={18} />
                Timeline
              </span>
              {activeTab === 'timeline' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            {issue.assignedParalegal && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 sm:flex-none px-6 py-4 font-semibold transition-all relative ${
                  activeTab === 'chat'
                    ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2 justify-center sm:justify-start">
                  <MessageSquare size={18} />
                  Discussion
                </span>
                {activeTab === 'chat' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Description Section */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" />
                    {t('issueDetail.description')}
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl break-words overflow-wrap-anywhere">{issue.description}</p>
                </div>

                {/* Documents Section */}
                {issue.documents && issue.documents.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText size={20} className="text-purple-500" />
                      {t('issueDetail.documents')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {issue.documents.map((doc) => {
                        // Determine icon based on file format
                        const format = (doc.format || '').toLowerCase();
                        const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(format);
                        
                        return (
                          <motion.button
                            key={doc._id}
                            onClick={() => handleViewDocument(doc._id, doc.documentType, format)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all w-full text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg ${isImage ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                <FileText className="text-white" size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white break-words">{doc.documentType}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                  <ExternalLink size={12} />
                                  {format ? `${format.toUpperCase()} • ` : ''}{t('issueDetail.view')}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assigned Paralegal Info */}
                {issue.assignedParalegal && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <UserPlus size={20} className="text-green-500" />
                      Assigned Paralegal
                    </h2>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {issue.assignedParalegal.user?.fullName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{issue.assignedParalegal.user?.fullName || 'Paralegal'}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{issue.assignedParalegal.specialization || 'Legal Services'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <TimelineTracker history={issue.history} />
              </motion.div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && issue.assignedParalegal && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ChatWindow 
                  issueId={issue._id}
                  currentUser={user}
                  paralegalInfo={{
                    name: issue.assignedParalegal.user?.fullName || 'Paralegal',
                    specialization: issue.assignedParalegal.specialization || 'Legal Services'
                  }}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar - Mini Timeline */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Quick Timeline
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {issue.history && issue.history.slice(0, 5).map((event, idx) => (
                <div key={idx} className="flex gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white break-words">{event.event}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('timeline')}
              className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900 rounded-lg font-medium transition-colors text-sm"
            >
              View Full Timeline
            </button>
          </div>

          {issue.assignedParalegal && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-500" />
                Communication
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Discuss this case with your assigned paralegal in real-time.
              </p>
              <button 
                onClick={() => setActiveTab('chat')}
                className="w-full px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-900 rounded-lg font-medium transition-colors text-sm"
              >
                Open Discussion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditIssueModal
          issue={issue}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showAssignModal && (
        <AssignParalegalModal
          issueId={id}
          currentParalegal={issue.assignedParalegal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeDialog}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
      />
      </div>
    </motion.div>
  )
}

export default IssueDetailPage