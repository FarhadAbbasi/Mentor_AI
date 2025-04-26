import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useWebinarStore } from '../../../stores/webinarStore';
import { generateScriptPrompt } from '../../../lib/prompts/scriptingPrompts';
import { toast, ToastContainer } from 'react-toastify';

interface Slide {
  id: string;
  title: string;
  content: string;
  type: string;
  script: string | null;
}

export function ScriptingEditor() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { currentWebinarId, knowledgeBase, presentStep } = useWebinarStore();

  const allSlidesHaveScripts = slides.every(slide => slide.script);

  const fetchSlides = async () => {
    if (!currentWebinarId) return;

    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .eq('webinar_id', currentWebinarId)
      .order('order_index');

    if (error) {
      console.error('Error fetching slides:', error);
      return;
    }

    setSlides(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, [currentWebinarId]);

  const currentSlide = slides[currentSlideIndex];

  const handleScriptChange = async (script: string) => {
    if (!currentSlide) return;

    const updatedSlides = slides.map((slide, index) =>
      index === currentSlideIndex ? { ...slide, script } : slide
    );
    setSlides(updatedSlides);

    const { error } = await supabase
      .from('slides')
      .update({ script })
      .eq('id', currentSlide.id);

    if (error) {
      console.error('Error saving script:', error);
    }
  };



  const generateScript = async () => {
    if (!currentSlide || !knowledgeBase) return;
    console.log('slide index is :', currentSlideIndex);

    setGenerating(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + import.meta.env.VITE_OPEN_AI_KEY,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: generateScriptPrompt(currentSlide, slides, currentSlideIndex, knowledgeBase)
            },
            {
              role: 'user',
              content: 'Write the script following the provided context and guidelines.'
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      const script = data.choices[0].message.content;
      console.log('Script for Slide "', currentSlideIndex, '" Is :', script);
      await handleScriptChange(script);
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setGenerating(false);
    }
  };





  // UseEffect call, to render the Chatbot triggered functions
  useEffect(() => {
    console.log('Present Step in Scripting:', presentStep);
    const generateScriptForChatbot = async () => {
      await fetchSlides();
      if (slides.length === 0) return;
          toast.success('Generate Scripts here One-By-One');
          // await generateScript();
        }
    if (presentStep === "generateScript")
      generateScriptForChatbot();
  }, [presentStep]); // Runs when step changes







  const handleSave = async () => {
    if (!currentWebinarId) return;
    setSaving(true);

    const { error } = await supabase
      .from('webinars')
      .update({ scripting_completed: true })
      .eq('id', currentWebinarId);

    setSaving(false);

    if (error) {
      console.error('Error marking scripting as complete:', error);
      return;
    }
    // window.location.href = '/';
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex items-center justify-between">
        {/* <button
          onClick={() => window.location.href = '/webinar-creation'}
          className="text-teal-400 hover:text-teal-300 font-medium flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Steps
        </button> */}
        <div className="flex items-center space-x-4">
          {allSlidesHaveScripts && currentSlideIndex === slides.length - 1 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          )}
          <button
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-400">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
          <button
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          {slides.map((slide, index) => (
            <motion.button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(index)}
              className={`w-full text-left p-4 rounded-lg ${index === currentSlideIndex
                ? 'bg-teal-900/50 border border-teal-500'
                : 'bg-gray-800 hover:bg-gray-700'
                }`}
            >
              <p className="font-medium text-white truncate">{slide.title}</p>
              <p className="text-sm text-gray-400 mt-1 capitalize">{slide.type}</p>
            </motion.button>
          ))}
        </div>

        <div className="col-span-2 space-y-6">
          {currentSlide && (
            <>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{currentSlide.title}</h3>
                <p className="text-gray-300">{currentSlide.content}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Script</h3>
                  <button
                    onClick={generateScript}
                    disabled={generating}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{generating ? 'Generating...' : 'Generate Script'}</span>
                  </button>
                </div>

                <textarea
                  value={currentSlide.script || ''}
                  onChange={(e) => handleScriptChange(e.target.value)}
                  className="w-full h-[300px] bg-gray-800 text-white border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Write or generate a script for this slide..."
                />
                <p className="text-sm text-gray-400 mt-2">
                  The AI Generation uses the whole webinar, and 1000's of pieces of data for context. Due to that sometimes the responses may include scene narrations or set instructions, make sure to double check all the scripts!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}






// useEffect(() => {
//   console.log('Present Step in Scripting:', presentStep);
//   toast.success('Generating Script');
//   const generateScriptForChatbot = async () => {
//     await fetchSlides();
//     if (slides.length === 0) return;
//     setCurrentSlideIndex(0);
//     for (let i = 1; i < slides.length; i++) {
//       await new Promise((resolve) => setTimeout(resolve, 1000));
//       console.log('INDEX =', currentSlideIndex, 'and i =', i);
//       setCurrentSlideIndex(i);
//       if (currentSlideIndex === i)
//         await generateScript();
//       await new Promise((resolve) => setTimeout(resolve, 1000));
//     }
//   }
//   if (presentStep === "generateScript")
//     generateScriptForChatbot();
// }, [presentStep]); // Runs when step changes
