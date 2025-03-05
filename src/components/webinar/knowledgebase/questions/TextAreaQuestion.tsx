import React from 'react';
import { QuestionCard } from '../QuestionCard';

interface TextAreaQuestionProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextAreaQuestion({ question, value, onChange }: TextAreaQuestionProps) {
  return (
    <QuestionCard question={question}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
        placeholder="Type your answer here..."
      />
    </QuestionCard>
  );
}