import React, { useState } from 'react';
import { Upload, ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Source {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image';
}

interface EnhanceKnowledgeBaseProps {
  onBack: () => void;
}

export function EnhanceKnowledgeBase({ onBack }: EnhanceKnowledgeBaseProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Here we would normally upload and analyze the image
      // For now, we'll just add it as a source
      setSources([
        ...sources,
        {
          id: Date.now().toString(),
          title: file.name,
          content: 'Image analysis will be implemented',
          type: 'image',
        },
      ]);
    }
  };

  const addTextSource = () => {
    setSources([
      ...sources,
      {
        id: Date.now().toString(),
        title: '',
        content: '',
        type: 'text',
      },
    ]);
  };

  const generateSlides = async () => {
    setIsGenerating(true);
    // Implement slide generation with enhanced knowledge
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center text-teal-400 hover:text-teal-300 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={addTextSource}
          className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Text Source</span>
        </button>
        <label className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 cursor-pointer">
          <Upload className="w-5 h-5" />
          <span>Upload Image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      <div className="space-y-4">
        {sources.map((source) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <input
              type="text"
              value={source.title}
              onChange={(e) =>
                setSources(
                  sources.map((s) =>
                    s.id === source.id ? { ...s, title: e.target.value } : s
                  )
                )
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
              placeholder="Source Title"
            />
            {source.type === 'text' ? (
              <textarea
                value={source.content}
                onChange={(e) =>
                  setSources(
                    sources.map((s) =>
                      s.id === source.id ? { ...s, content: e.target.value } : s
                    )
                  )
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                placeholder="Source Content"
                rows={3}
              />
            ) : (
              <div className="text-gray-400 italic">Image source</div>
            )}
          </motion.div>
        ))}
      </div>

      {sources.length > 0 && (
        <button
          onClick={generateSlides}
          disabled={isGenerating}
          className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isGenerating ? 'Generating...' : 'Generate Slides'}</span>
        </button>
      )}
    </div>
  );
}