import React from 'react';

interface QuestionCardProps {
  question: string;
  children: React.ReactNode;
}

export function QuestionCard({ question, children }: QuestionCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">{question}</h3>
      {children}
    </div>
  );
}