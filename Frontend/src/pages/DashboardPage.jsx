"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import AddIssueModal from "../components/AddIssueModal"
import AddDocumentModal from "../components/AddDocumentModal"
import {
  FileText,
  Trash2,
  Plus,
  AlertCircle,
  Calendar,
  BarChart3,
  Eye,
  ExternalLink,
  MapPin,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const StatCard = ({ icon, title, value, color }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.02 }}
    className={`${color} p-6 rounded-xl transition-all duration-200 hover:shadow-lg border`}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">{icon}</div>
      <div>
        <p className="text-slate-600 text-sm">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  </motion.div>
)

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ issues: [], documents: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddIssueModalOpen, setAddIssueModalOpen] = useState(false)
  const [isAddDocumentModalOpen, setAddDocumentModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [issuesResponse, documentsResponse] = await Promise.all([
        apiClient.get("/citizens/issues"),
        apiClient.get("/citizens/documents"),
      ]);
      setData({
        issues: issuesResponse.data.issues || [],
        documents: documentsResponse.data.documents || [],
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to fetch your dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (type, id) => {
    const itemType = type === "issues" ? "issue" : "document";
    if (!window.confirm(`Are you sure you want to delete this ${itemType}?`)) return;

    const toastId = toast.loading(`Deleting ${itemType}...`);
    try {
      await apiClient.delete(`/${type}/${id}`);
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully.`, { id: toastId });
      fetchData(); // Refetch data to update the UI
    } catch (err) {
      toast.error(`Failed to delete ${itemType}: ${err.message}`, { id: toastId });
    }
  };

  const handleViewDetails = (type, id) => {
    navigate(`/${type}/${id}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "accepted":
        return "bg-green-100 text-green-700 border-green-200";
      case "submitted":
      case "in progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
      case "not_submitted":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "escalated":
      case "rejected":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center"><Spinner /></div>;
  if (error) return <div className="w-full max-w-4xl text-center p-8 bg-red-50 text-red-700 rounded-lg border border-red-200"><AlertCircle className="mx-auto mb-4" size={48} /><p>{error}</p></div>;

  return (
    <>
      <motion.div className="w-full max-w-7xl space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header Section */}
        <motion.div className="flex flex-wrap justify-between items-center gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.fullName}!</h1>
            <p className="text-slate-600 mt-2">Manage your legal issues and documents.</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
          <StatCard icon={<AlertCircle size={24} className="text-red-600" />} title="Active Issues" value={data.issues.filter(i => i.status !== "Resolved").length} color="bg-gradient-to-br from-red-50 to-pink-50 border-red-200" />
          <StatCard icon={<FileText size={24} className="text-blue-600" />} title="Total Documents" value={data.documents.length} color="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200" />
          <StatCard icon={<BarChart3 size={24} className="text-green-600" />} title="Resolved Issues" value={data.issues.filter(i => i.status === "Resolved").length} color="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" />
        </motion.div>

        {/* Legal Issues Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle size={24} className="text-cyan-600" /> My Legal Issues
              </h2>
              <button onClick={() => setAddIssueModalOpen(true)} className="btn-secondary flex items-center gap-2">
                <Plus size={16} /> Add Issue
              </button>
            </div>
            {data.issues.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {data.issues.map((issue) => (
                    <motion.div layout key={issue._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-slate-900 text-lg">{issue.issueType}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(issue.status)}`}>{issue.status}</span>
                          </div>
                          <p className="text-slate-700 mb-3 line-clamp-2">{issue.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Calendar size={14} />{new Date(issue.createdAt).toLocaleDateString()}</span>
                            {issue.kiosk && <span className="flex items-center gap-1"><MapPin size={14} />{issue.kiosk.location}</span>}
                          </div>
                          <div className="mt-3">
                            <button onClick={() => handleViewDetails("issues", issue._id)} className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm font-medium whitespace-nowrap"><Eye size={14} /> View Details</button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <button onClick={() => handleDelete("issues", issue._id)} className="p-1 text-slate-400 hover:text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500"><AlertCircle className="mx-auto mb-4 text-cyan-600" size={48} /><p className="font-semibold">No legal issues found</p><p className="text-sm">Click "Add Issue" to create your first one.</p></div>
            )}
          </div>
        </motion.div>

        {/* Documents Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <FileText size={24} className="text-cyan-600" /> My Documents
              </h2>
              <button onClick={() => setAddDocumentModalOpen(true)} className="btn-secondary flex items-center gap-2">
                <Plus size={16} /> Add Document
              </button>
            </div>
            {data.documents.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {data.documents.map((doc) => (
                    <motion.div layout key={doc._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="text-cyan-600" size={20} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-lg mb-1">{doc.documentType}</h3>
                            <div className="flex items-center gap-4 mb-3">
                              <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(doc.submissionStatus)}`}>{doc.submissionStatus?.replace("_", " ")}</span>
                              {doc.issueId && <span className="text-sm text-slate-500">Related to: {doc.issueId.issueType}</span>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1"><Calendar size={14} />{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-3 flex gap-4 flex-wrap">
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium whitespace-nowrap"><ExternalLink size={14} /> Open File</a>
                              <button onClick={() => handleViewDetails("documents", doc._id)} className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm font-medium whitespace-nowrap"><Eye size={14} /> View Details</button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <button onClick={() => handleDelete("documents", doc._id)} className="p-1 text-slate-400 hover:text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500"><FileText className="mx-auto mb-4 text-cyan-600" size={48} /><p className="font-semibold">No documents found</p><p className="text-sm">Click "Add Document" to upload your first one.</p></div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <AddIssueModal isOpen={isAddIssueModalOpen} onClose={() => setAddIssueModalOpen(false)} onSuccess={fetchData} />
      <AddDocumentModal isOpen={isAddDocumentModalOpen} onClose={() => setAddDocumentModalOpen(false)} onSuccess={fetchData} />
    </>
  )
}
export default DashboardPage