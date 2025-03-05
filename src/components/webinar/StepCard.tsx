import React from 'react';
import { Check, Clock, ArrowRight } from 'lucide-react';

interface StepCardProps {
  title: string;
  description: string;
  status: 'completed' | 'todo' | 'not-started';
  step: number;
  onClick?: () => void;
}

export function StepCard({ title, description, status, step, onClick }: StepCardProps) {
  const statusStyles = {
    completed: 'bg-green-900 border-green-700',
    todo: 'bg-teal-900 border-teal-700',
    'not-started': 'bg-gray-800 border-gray-700',
  };

  const iconStyles = {
    completed: 'text-green-400',
    todo: 'text-teal-400',
    'not-started': 'text-gray-400',
  };

  const StatusIcon = {
    completed: Check,
    todo: ArrowRight,
    'not-started': Clock,
  }[status];

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 ${statusStyles[status]} w-full text-left transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-400">Step {step}</span>
          <StatusIcon className={`w-5 h-5 ${iconStyles[status]}`} />
        </div>
        <span className="text-sm font-medium capitalize text-gray-400">
          {status === 'not-started' ? 'Not Started' : status}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  );
}