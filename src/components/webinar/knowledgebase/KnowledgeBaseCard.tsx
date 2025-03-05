import React from 'react';
import { motion } from 'framer-motion';

interface KnowledgeBaseCardProps {
  title: string;
  children: React.ReactNode;
}

export function KnowledgeBaseCard({ title, children }: KnowledgeBaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3 text-gray-300">{children}</div>
    </motion.div>
  );
}