import React from 'react';
import { Sparkles } from 'lucide-react';
import { QuestionCard } from '../QuestionCard';
import type { Topic } from '../../../../types/webinar';
import { useWebinarStore } from '../../../../stores/webinarStore';

interface TopicDetailsQuestionProps {
  question: string;
  topics: Topic[];
  currentTopicIndex: number;
  setCurrentTopicIndex: (index: number) => void;
  updateTopicDescription: (id: string, description: string) => void;
}

export function TopicDetailsQuestion({
  question,
  topics,
  currentTopicIndex,
  setCurrentTopicIndex,
  updateTopicDescription,
}: TopicDetailsQuestionProps) {
  const { isGenerating } = useWebinarStore();
  
  const generateTopicDescription = async (topicName: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer' + process.env.VITE_OPEN_AI_KEY,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert webinar content creator. Generate a detailed description of what should be covered in this webinar topic. Focus on valuable, actionable content.'
            },
            {
              role: 'user',
              content: `Generate a detailed description of what should be covered in the webinar topic: "${topicName}"`
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      const description = data.choices[0].message.content;
      return description;
    } catch (error) {
      console.error('Error generating topic description:', error);
      return null;
    }
  };

  if (topics.length === 0) {
    return (
      <QuestionCard question={question}>
        <p className="text-gray-400">Please add topics in the previous step first.</p>
      </QuestionCard>
    );
  }

  const currentTopic = topics[currentTopicIndex];

  const handleGenerateDescription = async () => {
    const description = await generateTopicDescription(currentTopic.name);
    if (description) {
      updateTopicDescription(currentTopic.id, description);
    }
  };

  return (
    <QuestionCard question={question}>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-white mb-2">
          <h4 className="font-medium">{currentTopic.name}</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentTopicIndex(Math.max(0, currentTopicIndex - 1))}
              disabled={currentTopicIndex === 0}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentTopicIndex(Math.min(topics.length - 1, currentTopicIndex + 1))}
              disabled={currentTopicIndex === topics.length - 1}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <textarea
            value={currentTopic.description}
            onChange={(e) => updateTopicDescription(currentTopic.id, e.target.value)}
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
            placeholder="Describe what should be covered in this topic..."
          />
          <button 
            onClick={handleGenerateDescription}
            disabled={isGenerating}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>
    </QuestionCard>
  );
}