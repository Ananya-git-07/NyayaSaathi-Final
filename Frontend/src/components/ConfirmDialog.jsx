import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = "warning" }) => {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle className="w-16 h-16 text-yellow-500" />,
    danger: <XCircle className="w-16 h-16 text-red-500" />,
    info: <Info className="w-16 h-16 text-blue-500" />,
    success: <CheckCircle className="w-16 h-16 text-green-500" />,
  };

  const buttonColors = {
    warning: "bg-yellow-500 hover:bg-yellow-600",
    danger: "bg-red-500 hover:bg-red-600",
    info: "bg-blue-500 hover:bg-blue-600",
    success: "bg-green-500 hover:bg-green-600",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>

          {/* Content */}
          <div className="relative p-8 text-center">
            {/* Icon with pulse animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {icons[type]}
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-slate-900 dark:text-white mb-3"
            >
              {title}
            </motion.h3>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed"
            >
              {message}
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200 min-w-[100px]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-6 py-3 rounded-xl font-semibold text-white ${buttonColors[type]} transition-all duration-200 min-w-[100px] shadow-lg`}
              >
                Confirm
              </motion.button>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
