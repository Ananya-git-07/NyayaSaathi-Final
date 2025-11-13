// PASTE THIS ENTIRE FILE INTO src/components/SmartAssistantButton.jsx

"use client"

import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const SmartAssistantButton = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl dark:shadow-cyan-400/25 transition-shadow"
      aria-label="Open AI Assistant"
    >
      <Sparkles size={28} />
    </motion.button>
  );
};
export default SmartAssistantButton;