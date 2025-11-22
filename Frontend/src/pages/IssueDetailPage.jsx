// PASTE THIS ENTIRE FILE INTO src/pages/IssueDetailPage.jsx

"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft, AlertCircle, Calendar, User, FileText, Trash2, ExternalLink, List, CheckCircle, Upload, UserCheck, Phone
} from "lucide-react"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import AssignParalegalModal from "../components/AssignParalegalModal"
import ChatWindow from "../components/ChatWindow" // <--- IMPORT CHAT

const TimelineEvent = ({ event, isLast }) => {
    const getIcon = () => {
        switch (event.event) {
            case 'Issue Created': return <AlertCircle className="text-white" size={16}/>;
            case 'Document Uploaded': return <Upload className="text-white" size={16}/>;
            case 'Status Changed': return <CheckCircle className="text-white" size={16}/>;
            case 'Assigned to Paralegal': return <UserCheck className="text-white" size={16}/>;
            default: return <List className="text-white" size={16}/>;
        }
    };
    return (
        <li className="relative flex gap-4">
            <div className={`absolute left-0 top-0 flex w-6 justify-center ${!isLast ? 'h-full' : 'h-6'}`}>
                <div className="w-px bg-slate-300 dark:bg-slate-700"></div>
            </div>
            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-cyan-600 rounded-full">
                {getIcon()}
            </div>
            <div className="pb-8">
                <p className="font-semibold text-slate-800 dark:text-white">{event.event}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{event.details}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
            </div>
        </li>
    );
};

const IssueDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);

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

  useEffect(() => {
    if (id) fetchIssue()
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return
    const toastId = toast.loading("Deleting issue...")
    try {
      await apiClient.delete(`/issues/${id}`)
      toast.success("Issue deleted successfully", { id: toastId })
      navigate("/dashboard")
    } catch (err) {
      toast.error(`Failed to delete issue: ${err.message}`, { id: toastId })
    }
  }

  if (loading) return <Spinner />
  if (error) return <div>{error}</div>
  if (!issue) return <div>Issue not found</div>

  const isAdminOrEmployee = user?.role === 'admin' || user?.role === 'employee';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft size={20} /> {t('issueDetail.back')}
        </button>
        <div className="flex gap-2">
          {isAdminOrEmployee && !issue.assignedParalegal && (
              <button onClick={() => setAssignModalOpen(true)} className="btn-primary flex items-center gap-2">
                  <UserCheck size={16} /> Assign Paralegal
              </button>
          )}
          {/* Only allow delete if not assigned or if admin */}
          {(!issue.assignedParalegal || user.role === 'admin') && (
             <button onClick={handleDelete} className="btn-secondary bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900 dark:border-red-800">
                <Trash2 size={16} /> {t('issueDetail.delete')}
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Issue Details */}
        <div className="lg:col-span-2 space-y-6">
            {/* Main Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <AlertCircle className="text-red-600 dark:text-red-400" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{issue.issueType}</h1>
                        <p className="text-slate-600 dark:text-slate-400">{t('issueDetail.status', { status: issue.status })}</p>
                    </div>
                </div>
                
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('issueDetail.description')}</h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{issue.description}</p>
                </div>

                {/* Assigned Paralegal Info */}
                {issue.assignedParalegal && (
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 flex items-start gap-4">
                        <div className="bg-cyan-100 dark:bg-cyan-800 p-2 rounded-full">
                            <UserCheck className="text-cyan-700 dark:text-cyan-300" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Assigned Paralegal</h4>
                            <p className="text-slate-700 dark:text-slate-300">{issue.assignedParalegal.user?.fullName}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                                <Phone size={14} /> {issue.assignedParalegal.phoneNumber || 'N/A'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Documents List */}
            {issue.documents && issue.documents.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('issueDetail.relatedDocs')}</h3>
                    <div className="space-y-2">
                        {issue.documents.map((doc) => (
                        <div key={doc._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-blue-500" />
                                <p className="text-slate-900 dark:text-white">{doc.documentType}</p>
                            </div>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1">
                            <ExternalLink size={14} /> {t('issueDetail.view')}
                            </a>
                        </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: History & Chat */}
        <div className="space-y-6">
            {/* Chat Section - Only visible if assigned */}
            {issue.assignedParalegal && (
                <ChatWindow issueId={id} />
            )}

            {/* History Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('issueDetail.caseHistory')}</h2>
                {issue.history && issue.history.length > 0 ? (
                    <ul>
                        {issue.history.map((event, index) => (
                            <TimelineEvent key={event._id || index} event={event} isLast={index === issue.history.length - 1} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">{t('issueDetail.noHistory')}</p>
                )}
            </div>
        </div>
      </div>

      <AssignParalegalModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setAssignModalOpen(false)} 
        issueId={id} 
        onSuccess={fetchIssue} 
      />
    </motion.div>
  )
}

export default IssueDetailPage