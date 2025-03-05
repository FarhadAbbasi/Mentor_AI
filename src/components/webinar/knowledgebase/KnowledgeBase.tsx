import React, { useEffect, useState } from 'react';
import { useWebinarStore } from '../../../stores/webinarStore';
import { KnowledgeBaseView } from './KnowledgeBaseView';
import { ErrorAlert } from '../../ui/ErrorAlert';
import { NavigationButtons } from './NavigationButtons';
import { useKnowledgeBaseState } from './useKnowledgeBaseState';
import { TextAreaQuestion, TopicsQuestion, ProductQuestion, BonusesQuestion } from './questions';


export function KnowledgeBase({ onComplete }: { onComplete?: () => void }) {
  const { generateKnowledgeBase, isGenerating, knowledgeBase, error, clearError, presentStep, setWebinarData } = useWebinarStore();
  const [currentStep, setCurrentStep] = useState(0);
  const { state, handlers } = useKnowledgeBaseState();

  const questions = [
    {
      id: 'description',
      question: 'Describe what your webinar is about, and what you want it to go over',
      type: 'textarea' as const,
    },
    {
      id: 'topics',
      question: 'What are the key topics you want covered in this webinar?',
      type: 'topics' as const,
    },
    {
      id: 'product',
      question: 'What offer are you making in the webinar?',
      type: 'product' as const,
    },
    {
      id: 'bonuses',
      question: 'What bonuses do you give to the viewers?',
      type: 'bonuses' as const,
      dependsOn: 'product',
    },
    {
      id: 'value',
      question: 'What is the value the viewer will get by listening to your webinar?',
      type: 'textarea' as const,
    },
  ];

  const renderQuestionContent = (question: typeof questions[0]) => {
    switch (question.type) {
      case 'textarea':
        return (
          <TextAreaQuestion
            question={question.question}
            value={state[question.id as keyof typeof state]}
            onChange={(value) => {
              const setter = handlers[`set${question.id.charAt(0).toUpperCase() + question.id.slice(1)}` as keyof typeof handlers] as (value: string) => void;
              setter(value);
            }}
          />
        );

      case 'topics':
        return (
          <TopicsQuestion
            question={question.question}
            topics={state.topics}
            newTopic={state.newTopic}
            setNewTopic={handlers.setNewTopic}
            addTopic={handlers.addTopic}
            removeTopic={handlers.removeTopic}
            updateTopicDescription={handlers.updateTopicDescription}
            webinarDescription={state.description}
          />
        );

      case 'product':
        return (
          <ProductQuestion
            question={question.question}
            product={state.product}
            setProduct={handlers.setProduct}
            onSkip={() => handlers.setProduct(null)}
          />
        );

      case 'bonuses':
        if (!state.product) return null;
        return (
          <BonusesQuestion
            question={question.question}
            bonuses={state.bonuses}
            setBonuses={handlers.setBonuses}
          />
        );
      default:
        return null;
    }
  };


  // Components Rendering for Chatbot Assistance
  // useEffect(() => {
  //   const generateKnowledgeBaseForChatbot = async () => {
  //     console.log('PRESENT STEP in KnowledgeBase:', presentStep);
  //     // await handleComplete();
  //   }
  //   if (presentStep === "generateKnowledgeBase")
  //     generateKnowledgeBaseForChatbot();
  // }, [presentStep]); 




  const handleComplete = async () => {
    const { description, topics, value, product, bonuses } = state;

    if (!description.trim()) {
      handlers.setError('Please provide a description of your webinar');
      return;
    }
    if (topics.length === 0) {
      handlers.setError('Please add at least one topic');
      return;
    }
    if (!value.trim()) {
      handlers.setError('Please describe the value viewers will get');
      return;
    }

    await generateKnowledgeBase({
      description,
      topics,
      value,
      product,
      bonuses,
      avoidTopics: '',
    });

    if (onComplete) {
      onComplete();
    }
  };

  if (knowledgeBase) {
    return <KnowledgeBaseView />;
  }

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto">
      {error && <ErrorAlert error={error} onDismiss={clearError} />}

      {renderQuestionContent(currentQuestion)}

      <NavigationButtons
        currentStep={currentStep}
        isLastStep={isLastStep}
        isGenerating={isGenerating}
        onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
        onNext={() => {
          if (isLastStep) {
            handleComplete();
          } else {
            setCurrentStep(Math.min(questions.length - 1, currentStep + 1));
          }
        }}
      />
    </div>
  );
}