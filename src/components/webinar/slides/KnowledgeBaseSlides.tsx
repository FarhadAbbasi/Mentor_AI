import React, { useState } from 'react';
import { useWebinarStore } from '../../../stores/webinarStore';
import { Reorder } from 'framer-motion';
import { GripVertical, Plus, ArrowLeft } from 'lucide-react';
import { generateSlides } from '../../../lib/openai';

interface Slide {
  id: string;
  title: string;
  content: string;
}

interface KnowledgeBaseSlidesProps {
  onBack: () => void;
}

export function KnowledgeBaseSlides({ onBack }: KnowledgeBaseSlidesProps) {
  const { knowledgeBase } = useWebinarStore();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const generateInitialSlides = async () => {
      try {
        const generatedSlides = await generateSlides(knowledgeBase);
        setSlides(generatedSlides);
      } catch (err) {
        setError('Failed to generate slides. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateInitialSlides();
  }, [knowledgeBase]);

  const addSlide = (index: number) => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: 'New Slide',
      content: '',
    };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
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

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {isGenerating ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating slides from your knowledge base...</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={slides} onReorder={setSlides} className="space-y-4">
          {slides.map((slide, index) => (
            <React.Fragment key={slide.id}>
              <Reorder.Item value={slide} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) =>
                        setSlides(
                          slides.map((s) =>
                            s.id === slide.id ? { ...s, title: e.target.value } : s
                          )
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
                      placeholder="Slide Title"
                    />
                    <textarea
                      value={slide.content}
                      onChange={(e) =>
                        setSlides(
                          slides.map((s) =>
                            s.id === slide.id ? { ...s, content: e.target.value } : s
                          )
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                      placeholder="Slide Content"
                      rows={3}
                    />
                  </div>
                </div>
              </Reorder.Item>
              <button
                onClick={() => addSlide(index)}
                className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:border-teal-600 hover:text-teal-400 transition-colors"
              >
                <Plus className="w-5 h-5 mx-auto" />
              </button>
            </React.Fragment>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}