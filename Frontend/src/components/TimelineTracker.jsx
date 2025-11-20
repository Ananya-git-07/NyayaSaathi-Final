import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const TimelineTracker = ({ history = [] }) => {
  const { t } = useTranslation();

  // Sort history by timestamp (newest first)
  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getEventIcon = (event) => {
    switch (event) {
      case 'Issue Created':
        return '📝';
      case 'Document Uploaded':
        return '📄';
      case 'Status Changed':
        return '🔄';
      case 'Assigned to Paralegal':
        return '👤';
      case 'Note Added':
        return '💬';
      default:
        return '•';
    }
  };

  const getEventColor = (event) => {
    switch (event) {
      case 'Issue Created':
        return 'bg-blue-500';
      case 'Document Uploaded':
        return 'bg-green-500';
      case 'Status Changed':
        return 'bg-purple-500';
      case 'Assigned to Paralegal':
        return 'bg-orange-500';
      case 'Note Added':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {t('Case Timeline')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        {t('Case Timeline')}
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        
        {/* Timeline events */}
        <div className="space-y-6">
          {sortedHistory.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4"
            >
              {/* Icon circle */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getEventColor(item.event)} flex items-center justify-center text-white text-xl z-10 shadow-lg`}>
                {getEventIcon(item.event)}
              </div>
              
              {/* Event content */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {item.event}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {item.details && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                    {item.details}
                  </p>
                )}
                
                {item.actor && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    by {item.actor}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineTracker;
