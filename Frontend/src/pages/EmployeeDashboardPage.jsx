import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import Spinner from '../components/Spinner';
import AssignParalegalModal from '../components/AssignParalegalModal';
import { 
  Briefcase, Clock, CheckCircle, UserCheck, 
  FileText, TrendingUp, Calendar, Users, UserPlus 
} from 'lucide-react';

const EmployeeDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIssueForAssignment, setSelectedIssueForAssignment] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get('/employees/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <Spinner />;
  if (!dashboardData) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Failed to load employee dashboard. Please ensure you're logged in with an employee account.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  const { employee, statistics, unassignedCases, recentCases, recentActivity, message } = dashboardData;

  const filteredCases = filter === 'all' 
    ? recentCases 
    : filter === 'unassigned'
    ? unassignedCases
    : recentCases.filter(c => c.status === filter);

  const handleAssignmentSuccess = () => {
    setSelectedIssueForAssignment(null);
    // Refresh dashboard data
    window.location.reload();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {employee.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {employee.department} • {employee.position}
          </p>
          {message && (
            <div className="mt-3 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ {message}</p>
            </div>
          )}
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cases</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {statistics.totalCases}
                </p>
              </div>
              <Briefcase className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {statistics.pendingCases}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {statistics.inProgressCases}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {statistics.resolvedCases}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unassigned</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {statistics.unassignedCases}
                </p>
              </div>
              <Users className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </motion.div>
        </div>

        {/* Unassigned Cases Alert */}
        {unassignedCases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                {unassignedCases.length} Case{unassignedCases.length > 1 ? 's' : ''} Need Assignment
              </h3>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              These pending cases have not been assigned to a paralegal yet.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* All Cases */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  All Cases
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unassigned')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Unassigned
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('in-progress')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    In Progress
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredCases.map((caseItem) => (
                  <motion.div
                    key={caseItem._id}
                    whileHover={{ scale: 1.01 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div 
                      onClick={() => navigate(`/issue/${caseItem._id}`)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {caseItem.title || caseItem.issueType}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {caseItem.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {caseItem.assignedParalegal ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <UserCheck className="w-3 h-3" />
                            Assigned
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <Users className="w-3 h-3" />
                              Unassigned
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIssueForAssignment(caseItem);
                              }}
                              className="ml-2 px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 
                                       flex items-center gap-1 transition-colors"
                            >
                              <UserPlus className="w-3 h-3" />
                              Assign
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredCases.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No cases found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="border-l-2 border-blue-600 dark:border-blue-400 pl-3 py-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {activity.event}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {activity.issueTitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedIssueForAssignment && (
        <AssignParalegalModal
          isOpen={true}
          onClose={() => setSelectedIssueForAssignment(null)}
          issueId={selectedIssueForAssignment._id}
          currentAssignment={selectedIssueForAssignment.assignedParalegal}
          onAssignmentSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
};

export default EmployeeDashboardPage;
