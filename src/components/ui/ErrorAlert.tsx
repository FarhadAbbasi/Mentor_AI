import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  error: string;
  onDismiss: () => void;
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  return (
    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 flex items-center space-x-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <p className="text-red-200">{error}</p>
      <button
        onClick={onDismiss}
        className="ml-auto text-red-400 hover:text-red-300"
      >
        Dismiss
      </button>
    </div>
  );
}