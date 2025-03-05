import React, { useState } from 'react';
import { useWebinarStore } from '../../../stores/webinarStore';
import { Brain, Sparkles, Upload, X, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { KnowledgeBaseSlides } from './KnowledgeBaseSlides';
import { EnhanceKnowledgeBase } from './EnhanceKnowledgeBase';

export function SlideGeneration() {
  const [mode, setMode] = useState<'select' | 'knowledge' | 'enhance'>('select');
  const { knowledgeBase } = useWebinarStore();

  const renderContent = () => {
    switch (mode) {
      case 'knowledge':
        return <KnowledgeBaseSlides onBack={() => setMode('select')} />;
      case 'enhance':
        return <EnhanceKnowledgeBase onBack={() => setMode('select')} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode('knowledge')}
              className="bg-black border-2 border-gray-800 hover:border-teal-600 rounded-xl p-6 text-left transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 rounded-lg bg-gray-800 group-hover:bg-teal-900/50">
                  <Brain className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Use Knowledge Base Only</h3>
              </div>
              <p className="text-gray-400">
                Generate slides directly from your existing knowledge base content
              </p>
            </button>

            <button
              onClick={() => setMode('enhance')}
              className="bg-black border-2 border-gray-800 hover:border-teal-600 rounded-xl p-6 text-left transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 rounded-lg bg-gray-800 group-hover:bg-teal-900/50">
                  <Sparkles className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Enhance Knowledge Base</h3>
              </div>
              <p className="text-gray-400">
                Generate additional content and slides based on your knowledge base
              </p>
            </button>
          </div>
        );
    }
  };

  return <div className="space-y-6">{renderContent()}</div>;
}