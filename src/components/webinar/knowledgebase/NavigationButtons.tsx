import React from 'react';

interface NavigationButtonsProps {
  currentStep: number;
  isLastStep: boolean;
  isGenerating: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function NavigationButtons({
  currentStep,
  isLastStep,
  isGenerating,
  onPrevious,
  onNext,
}: NavigationButtonsProps) {
  return (
    <div className="mt-8 flex justify-between">
      <button
        onClick={onPrevious}
        className={`px-6 py-2 rounded-lg ${
          currentStep === 0
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
        disabled={currentStep === 0}
      >
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={isGenerating}
        className={`px-6 py-2 rounded-lg ${
          isLastStep
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-teal-600 text-white hover:bg-teal-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isGenerating ? 'Generating...' : isLastStep ? 'Complete' : 'Next'}
      </button>
    </div>
  );
}