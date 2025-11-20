import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Calendar, Clock, User, Plus, CheckCircle, XCircle, PlayCircle } from "lucide-react";
import apiClient from "../api/axiosConfig";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";

const VideoSessionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirmState, confirm, closeDialog } = useConfirm();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [paralegals, setParalegals] = useState([]);
  const [newSession, setNewSession] = useState({
    paralegalId: "",
    scheduledTime: "",
    issueId: "",
  });

  useEffect(() => {
    fetchSessions();
    if (user?.role === 'citizen') {
      fetchParalegals();
    }
  }, [filter]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const response = await apiClient.get("/videosessions/sessions", { params });
      setSessions(response.data.data);
    } catch (error) {
      console.error("Fetch sessions error:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch sessions";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchParalegals = async () => {
    try {
      const response = await apiClient.get("/paralegals");
      setParalegals(response.data.data);
    } catch (error) {
      console.error("Failed to fetch paralegals");
    }
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/videosessions/sessions", newSession);
      toast.success("Session scheduled successfully!");
      setShowScheduleModal(false);
      setNewSession({ paralegalId: "", scheduledTime: "", issueId: "" });
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule session");
    }
  };

  const handleJoinSession = (sessionId) => {
    navigate(`/video-call/${sessionId}`);
  };

  const handleCancelSession = async (sessionId) => {
    const confirmed = await confirm({
      title: "Cancel Video Session?",
      message: "Are you sure you want to cancel this video consultation session? This action cannot be undone.",
      type: "danger"
    });

    if (!confirmed) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        await apiClient.patch(`/videosessions/sessions/${sessionId}/cancel`);
        await fetchSessions();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(
      promise,
      {
        loading: 'Cancelling session...',
        success: 'Session cancelled successfully',
        error: 'Failed to cancel session',
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
      case "in-progress":
        return "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400";
      case "completed":
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <Video className="text-cyan-500" size={40} />
              Video Consultations
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Schedule and manage video sessions with paralegals
            </p>
          </div>
          
          {user?.role === 'citizen' && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium transition-colors shadow-lg"
            >
              <Plus size={20} />
              Schedule Session
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {["all", "scheduled", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? "bg-cyan-500 text-white shadow-lg"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <Video className="mx-auto text-slate-400 mb-4" size={60} />
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              No sessions found. {user?.role === 'citizen' && "Schedule your first consultation!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sessions.map((session) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Video className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {user?.role === 'citizen' 
                            ? `Consultation with ${session.paralegal?.user?.fullName || 'Paralegal'}`
                            : `Consultation with ${session.citizen?.fullName || 'Citizen'}`
                          }
                        </h3>
                        {session.issueId && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Issue: {session.issueId.title || session.issueId.issueType}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Calendar size={16} />
                        <span className="text-sm">
                          {new Date(session.scheduledTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock size={16} />
                        <span className="text-sm">
                          {new Date(session.scheduledTime).toLocaleTimeString()}
                        </span>
                      </div>
                      {session.duration && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock size={16} />
                          <span className="text-sm">{session.duration} minutes</span>
                        </div>
                      )}
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>

                    {session.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        <strong>Notes:</strong> {session.notes}
                      </p>
                    )}

                    {session.feedback && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                          Rating: {'⭐'.repeat(session.feedback.rating)}
                        </p>
                        {session.feedback.comment && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {session.feedback.comment}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {session.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => handleJoinSession(session._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                        >
                          <PlayCircle size={18} />
                          Join
                        </button>
                        <button
                          onClick={() => handleCancelSession(session._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                        >
                          <XCircle size={18} />
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {session.status === "completed" && session.recordingUrl && (
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium transition-colors"
                      >
                        <PlayCircle size={18} />
                        View Recording
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Schedule Video Session
            </h2>

            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Paralegal
                </label>
                <select
                  value={newSession.paralegalId}
                  onChange={(e) => setNewSession({ ...newSession, paralegalId: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cyan-500"
                >
                  <option value="">Choose a paralegal</option>
                  {paralegals.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.user?.fullName} - {p.areasOfExpertise?.join(", ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newSession.scheduledTime}
                  onChange={(e) => setNewSession({ ...newSession, scheduledTime: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium"
                >
                  Schedule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
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
  );
};

export default VideoSessionsPage;
