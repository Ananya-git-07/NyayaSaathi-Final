import React from 'react';

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

export default GlassCard;