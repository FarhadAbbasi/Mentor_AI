import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  status: 'completed' | 'generating' | 'not-started';
}

export function DashboardCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  disabled,
  status 
}: DashboardCardProps) {
  const statusStyles = {
    completed: 'bg-green-900/50 border-green-600 hover:bg-green-900/70',
    generating: 'bg-teal-900/50 border-teal-600 animate-pulse',
    'not-started': disabled ? 'bg-gray-800/50 border-gray-700 opacity-50' : 'bg-black border-gray-800 hover:bg-gray-900',
  };

  const iconStyles = {
    completed: 'text-green-400',
    generating: 'text-teal-400',
    'not-started': disabled ? 'text-gray-400' : 'text-teal-400',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || status === 'generating'}
      className={`p-6 rounded-xl transition-all duration-200 text-left w-full border ${
        statusStyles[status]
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg bg-black/50`}>
          <Icon className={`w-6 h-6 ${iconStyles[status]}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {status === 'completed' && (
              <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                Completed
              </span>
            )}
            {status === 'generating' && (
              <span className="text-xs bg-teal-900 text-teal-300 px-2 py-1 rounded">
                Generating...
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}