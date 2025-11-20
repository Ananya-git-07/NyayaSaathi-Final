import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import Spinner from '../components/Spinner';
import { 
  Briefcase, Clock, CheckCircle, AlertCircle, 
  FileText, TrendingUp, Calendar 
} from 'lucide-react';

const ParalegalDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get('/paralegals/dashboard');
        // Handle ApiResponse format (response.data.data) or direct data format
        const data = response.data.data || response.data;
        setDashboardData(data);
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('paralegalDashboard.accessDenied')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('paralegalDashboard.accessDeniedDesc')}
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('paralegalDashboard.goToDashboard')}
        </button>
      </div>
    </div>
  );

  const { paralegal, statistics, urgentCases, assignedCases, recentActivity, message } = dashboardData;

  const filteredCases = filter === 'all' 
    ? assignedCases 
    : assignedCases.filter(c => c.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-orange-600 dark:text-orange-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
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
            {t('paralegalDashboard.welcome')}, {paralegal.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {paralegal.areasOfExpertise && paralegal.areasOfExpertise.length > 0 
              ? paralegal.areasOfExpertise.join(', ') 
              : t('paralegalDashboard.noSpecialization')} • {t('paralegalDashboard.phoneNumber')}: {paralegal.phoneNumber}
          </p>
          {message && (
            <div className="mt-3 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ {message}</p>
            </div>
          )}
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('paralegalDashboard.stats.totalCases')}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('paralegalDashboard.stats.pending')}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('paralegalDashboard.stats.inProgress')}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('paralegalDashboard.stats.resolved')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {statistics.resolvedCases}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>
        </div>

        {/* Urgent Cases Alert */}
        {urgentCases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                {urgentCases.length} {urgentCases.length > 1 ? t('paralegalDashboard.urgentCasesPlural') : t('paralegalDashboard.urgentCases')} {t('paralegalDashboard.requireAttention')}
              </h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              {t('paralegalDashboard.urgentCasesDesc')}
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Cases */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('paralegalDashboard.assignedCases')}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {t('paralegalDashboard.filters.all')}
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {t('paralegalDashboard.filters.pending')}
                  </button>
                  <button
                    onClick={() => setFilter('in-progress')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {t('paralegalDashboard.filters.inProgress')}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredCases.map((caseItem) => (
                  <motion.div
                    key={caseItem._id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/issue/${caseItem._id}`)}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
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
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </span>
                      <span className={getUrgencyColor(caseItem.urgency)}>
                        {t(`paralegalDashboard.priority.${caseItem.urgency || 'medium'}`)}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {filteredCases.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {t('paralegalDashboard.noCasesFound')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('paralegalDashboard.recentActivity')}
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
                    {t('paralegalDashboard.noRecentActivity')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParalegalDashboardPage;
