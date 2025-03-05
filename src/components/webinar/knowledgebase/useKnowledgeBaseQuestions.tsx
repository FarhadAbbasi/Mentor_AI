import React from 'react';
import type { Topic, Product, Bonus } from '../../../types/webinar';
import {
  TextAreaQuestion,
  TopicsQuestion,
  ProductQuestion,
  BonusesQuestion,
} from './questions';

interface KnowledgeBaseState {
  topics: Topic[];
  product: Product | null;
  bonuses: Bonus[];
  description: string;
  avoidTopics: string;
  value: string;
  newTopic: string;
  currentTopicIndex: number;
}

interface KnowledgeBaseHandlers {
  setTopics: (topics: Topic[]) => void;
  setProduct: (product: Product | null) => void;
  setBonuses: (bonuses: Bonus[]) => void;
  setDescription: (description: string) => void;
  setAvoidTopics: (topics: string) => void;
  setValue: (value: string) => void;
  setNewTopic: (topic: string) => void;
  setCurrentTopicIndex: (index: number) => void;
  addTopic: () => void;
  removeTopic: (id: string) => void;
  updateTopicDescription: (id: string, description: string) => void;
}

type QuestionType = {
  id: string;
  question: string;
  type: 'textarea' | 'topics' | 'product' | 'bonuses';
  dependsOn?: string;
};

export function useKnowledgeBaseQuestions(
  state: KnowledgeBaseState,
  handlers: KnowledgeBaseHandlers
) {
  const questions: QuestionType[] = [
    {
      id: 'description',
      question: 'Describe what your webinar is about, and what you want it to go over',
      type: 'textarea',
    },
    {
      id: 'topics',
      question: 'What are the key topics you want covered in this webinar?',
      type: 'topics',
    },
    {
      id: 'product',
      question: 'What offer are you making in the webinar?',
      type: 'product',
    },
    {
      id: 'bonuses',
      question: 'What bonuses do you give to the viewers?',
      type: 'bonuses',
      dependsOn: 'product',
    },
    {
      id: 'avoidTopics',
      question: "Are there any topics you don't want covered in your webinar?",
      type: 'textarea',
    },
    {
      id: 'value',
      question: 'What is the value the viewer will get by listening to your webinar?',
      type: 'textarea',
    },
  ];

  const renderQuestionContent = (question: QuestionType, currentStep: number) => {
    if (!question) return null;

    if (question.dependsOn === 'product' && !state.product) {
      return null;
    }

    switch (question.type) {
      case 'textarea':
        return (
          <TextAreaQuestion
            question={question.question}
            value={state[question.id as keyof Pick<KnowledgeBaseState, 'description' | 'avoidTopics' | 'value'>]}
            onChange={(value) => {
              const setter = handlers[`set${question.id.charAt(0).toUpperCase() + question.id.slice(1)}` as keyof KnowledgeBaseHandlers] as (value: string) => void;
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

  return { questions, renderQuestionContent };
}