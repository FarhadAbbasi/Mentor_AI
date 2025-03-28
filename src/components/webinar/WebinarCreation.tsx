import React, { useState, useEffect } from 'react';
import { StepCard } from './StepCard';
import { SlideEditor } from './slides/SlideEditor';
import { ThemeSelection } from './ThemeSelection';
import { ScriptingEditor } from './scripting/ScriptingEditor';
import { AvatarSelection } from './AvatarSelection';
import { useWebinarStore } from '../../stores/webinarStore';
import * as queries from '../../lib/database/queries';
import { ReviewandRelease } from './VideoGeneration/ReviewandRelease';

const WEBINAR_STEPS = [
  {
    title: 'Slide Generation',
    description: 'Create and customize your webinar slides',
    requiredStep: null
  },
  {
    title: 'Theme Selection',
    description: 'Choose from our collection of professional themes',
    requiredStep: 0
  },
  {
    title: 'Scripting',
    description: 'Write or generate AI-powered scripts for each slide',
    requiredStep: 1
  },
  {
    title: 'Avatar Selection',
    description: 'Choose your virtual presenter',
    requiredStep: 2
  },
  {
    title: 'Review and Release',
    description: 'Preview and launch your completed webinar',
    requiredStep: 3
  },
];

export function WebinarCreation({ onComplete }: { onComplete?: () => void }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { presentStep, currentWebinarId } = useWebinarStore();


  // Components Rendering for Chatbot triggered functions
  useEffect(() => {
    // console.log('PRESENT STEP in Webinar creation:', presentStep);
    const renderComponentsForAI = () => {
      if (presentStep === "generateSlides")
        setActiveStep(0);
      if (presentStep === "generateScript")
        setActiveStep(2);
    }
    renderComponentsForAI();
  }, [presentStep]);





  useEffect(() => {
    const checkStepCompletion = async () => {
      if (!currentWebinarId) return;

      try {
        const [slides, webinar] = await Promise.all([
          queries.getSlides(currentWebinarId),
          queries.getWebinar(currentWebinarId)
        ]);

        const completedSteps = [];

        // Check slide generation completion
        if (slides?.length > 0) {
          completedSteps.push(0);
        }

        // Check theme selection completion
        if (webinar?.theme_id) {
          completedSteps.push(1);
        }

        // Check scripting completion
        if (webinar?.scripting_completed) {
          completedSteps.push(2);
        }

        // Check avatar selection completion
        if (webinar?.avatar_id) {
          completedSteps.push(3);
        }

        // Check Video completion
        if (webinar?.avatar_id) {
          completedSteps.push(3);
        }

        setCompletedSteps(completedSteps);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error checking step completion:', error.message);
        } else {
          console.error('Error checking step completion:', error);
        }
      }
    };

    checkStepCompletion();
  }, [currentWebinarId]);

  const getStepStatus = (index: number) => {
    if (completedSteps.includes(index)) return 'completed';

    // Check if previous required step is completed
    const requiredStep = WEBINAR_STEPS[index].requiredStep;
    if (requiredStep === null || completedSteps.includes(requiredStep)) {
      return 'todo';
    }

    return 'not-started';
  };

  const handleStepClick = (index: number) => {
    const status = getStepStatus(index);
    if (status === 'not-started') return;
    setActiveStep(index);
  };




  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <SlideEditor />;
      case 1:
        return <ThemeSelection onComplete={onComplete} />;
      case 2:
        return <ScriptingEditor />;
      case 3:
        return <AvatarSelection onComplete={onComplete} />;
      default:
        return <ReviewandRelease />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-white">Webinar Creation</h2>
        <p className="text-gray-400">Complete these steps to create your webinar</p>
      </div>
      {activeStep === -1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WEBINAR_STEPS.map((step, index) => (
            <StepCard
              key={index}
              step={index + 1}
              title={step.title}
              description={step.description}
              status={getStepStatus(index)}
              onClick={() => handleStepClick(index)}
            />
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setActiveStep(-1)}
            className="mb-6 text-teal-400 hover:text-teal-300 font-medium flex items-center"
          >
            ← Back to Steps
          </button>
          {renderStepContent()}
        </div>
      )}
    </div>
  );
}