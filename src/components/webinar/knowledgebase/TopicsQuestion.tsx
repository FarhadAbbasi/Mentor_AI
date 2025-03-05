import React, { useState } from 'react';
import { PlusCircle, X, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionCard } from './QuestionCard';
import { generateTopicDescription } from '../../../lib/openai';
import { useWebinarStore } from '../../../stores/webinarStore';
import type { Topic } from '../../../types/webinar';

interface TopicsQuestionProps {
  question: string;
  topics: Topic[];
  newTopic: string;
  setNewTopic: (value: string) => void;
  addTopic: () => void;
  removeTopic: (id: string) => void;
  updateTopicDescription: (id: string, description: string) => void;
  webinarDescription: string;
}

export function TopicsQuestion({
  question,
  topics,
  newTopic,
  setNewTopic,
  addTopic,
  removeTopic,
  updateTopicDescription,
  webinarDescription,
}: TopicsQuestionProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDescription = async (topicId: string, topicName: string, index: number) => {
    if (!webinarDescription) {
      setError('Please provide a webinar description first');
      return;
    }

    setGeneratingId(topicId);
    setError(null);
    
    try {
      const description = await generateTopicDescription(
        topicName,
        index,
        webinarDescription
      );
      updateTopicDescription(topicId, description);
    } catch (error) {
      setError('Failed to generate description. Please try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <QuestionCard question={question}>
      <div className="space-y-4">
        {error && (
          <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
            placeholder="Enter a topic"
            onKeyPress={(e) => e.key === 'Enter' && addTopic()}
          />
          <button
            onClick={addTopic}
            disabled={!newTopic.trim()}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 bg-gray-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{topic.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleGenerateDescription(topic.id, topic.name, index)}
                    disabled={generatingId === topic.id || !webinarDescription}
                    className="text-teal-400 hover:text-teal-300 disabled:opacity-50 transition-all"
                    title={!webinarDescription ? "Please provide a webinar description first" : "Generate description with AI"}
                  >
                    {generatingId === topic.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => removeTopic(topic.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove topic"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <textarea
                value={topic.description}
                onChange={(e) => updateTopicDescription(topic.id, e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-3 min-h-[100px] mt-2"
                placeholder="Describe what should be covered in this topic..."
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </QuestionCard>
  );
}