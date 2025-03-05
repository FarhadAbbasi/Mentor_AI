import React from 'react';
import { useWebinarProgress } from '../../hooks/useWebinarProgress';
import { Brain, Presentation, Package, Gift } from 'lucide-react';

export function WebinarProgress() {
  const { progress, loading } = useWebinarProgress();

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-800 rounded-lg p-4">
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      icon: Brain,
      label: 'Knowledge Base',
      completed: progress.hasKnowledgeBase,
      detail: progress.hasKnowledgeBase ? 'Complete' : 'Not started',
    },
    {
      icon: Presentation,
      label: 'Slides',
      completed: progress.slidesCount > 0,
      detail: `${progress.slidesCount} slides created`,
    },
    {
      icon: Package,
      label: 'Product',
      completed: progress.hasProduct,
      detail: progress.hasProduct ? 'Added' : 'Not added',
    },
    {
      icon: Gift,
      label: 'Bonuses',
      completed: progress.bonusesCount > 0,
      detail: `${progress.bonusesCount} bonuses added`,
    },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Webinar Progress</h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="flex items-center space-x-4 text-gray-400"
            >
              <div className={`p-2 rounded-lg ${
                step.completed ? 'bg-green-900/50 text-green-400' : 'bg-gray-700'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{step.label}</span>
                  <span className="text-sm">{step.detail}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="ml-4 mt-2 h-8 border-l-2 border-gray-700"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}