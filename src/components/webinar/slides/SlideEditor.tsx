import React, { useState, useEffect } from 'react';
import { useWebinarStore } from '../../../stores/webinarStore';
import { Reorder, motion } from 'framer-motion';
import { GripVertical, Plus, ArrowLeft, Loader2, Save, ArrowRightCircle, RefreshCcw, RefreshCw } from 'lucide-react';
import { generateSlide } from '../../../lib/openai';
import * as slidesDB from '../../../lib/database/slides';
import { ProgressBar } from '../../ui/ProgressBar';

import type { Slide } from '../../../types/webinar';
import { toast, ToastContainer } from 'react-toastify';
// import { getSlides } from '../../../lib/database/queries';
import * as queries from '../../../lib/database/queries';
import { supabase } from '../../../lib/supabase';


export function SlideEditor() {
  const { knowledgeBase, currentWebinarId } = useWebinarStore();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [generateSlides, setGenerateSlides] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSlides = knowledgeBase?.webinarSummary.topics.length
    ? knowledgeBase.webinarSummary.topics.length + 2 // topics + intro + agenda
    : 0;



  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const slidesData = await queries.getSlides(currentWebinarId);
        console.log('Slides data in Slide Editor:', slidesData);
        setSlides(slidesData);
        setGenerateSlides(false);
      }
      catch (error) {
        console.log('Error :', error);
        toast.error('Fetching Slides Failed');
        setGenerateSlides(true);
      }
    }

    fetchSlides();
  }, [])




  useEffect(() => {
    const generateInitialSlides = async () => {
      if (!knowledgeBase) return;
      console.log('GenerateSlides:', generateSlides);
      if (!generateSlides) return;

      // Start Generating Slides
      setIsGenerating(true);
      try {
        const totalContentSlides = knowledgeBase.webinarSummary.topics.length;
        setCurrentGeneratingIndex(0);
        const allSlides: Slide[] = [];

        // Generate intro slide
        const introSlide = await generateSlide({
          knowledgeBase,
          slideType: 'intro',
          slideNumber: 1,
          totalSlides
        });
        allSlides.push(introSlide);
        setSlides([...allSlides]);
        setCurrentGeneratingIndex(1);

        // Generate agenda slide
        const agendaSlide = await generateSlide({
          knowledgeBase,
          previousSlide: introSlide,
          slideType: 'agenda',
          slideNumber: 2,
          totalSlides
        });
        allSlides.push(agendaSlide);
        setSlides([...allSlides]);
        setCurrentGeneratingIndex(2);

        // Generate content slides with proper progress tracking
        for (let i = 0; i < totalContentSlides; i++) {
          setCurrentGeneratingIndex(i + 3);
          console.log(`Generating content slide ${i + 1} of ${totalContentSlides}`);

          const contentSlide = await generateSlide({
            knowledgeBase,
            previousSlide: allSlides[allSlides.length - 1],
            slideType: 'content',
            slideNumber: i + 3,
            totalSlides: totalContentSlides + 2 // Add 2 for intro and agenda slides
          });

          // Ensure the slide has the correct type
          contentSlide.type = 'content';

          allSlides.push(contentSlide);
          setSlides([...allSlides]);
        }

        console.log(`Generated ${allSlides.length} total slides`);
        console.log(`Generated slides are :`, allSlides, '>> Slides END');

      } catch (err) {
        console.error('Error generating slides:', err);
        setError('Failed to generate slides. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateInitialSlides();
  }, [knowledgeBase, generateSlides]);



  // Components Rendering for Chatbot triggered functions
  const { presentStep } = useWebinarStore();
  console.log('Step in Slides:', presentStep);

  useEffect(() => {
    const generateSlidesForChatbot = async () => {
      await regenerateSlides();
      // await handleSave();
      toast.success('Slides Generated. Click on SAVE');
    }
    if (presentStep === "generateSlides")
    generateSlidesForChatbot();

  }, [presentStep]);




  const regenerateSlides = async () => {
    setSlides([]);
    setGenerateSlides(true);

    // Set Scripting_Completed as "FALSE"
    const { error } = await supabase
      .from('webinars')
      .update({ scripting_completed: false })
      .eq('id', currentWebinarId);

    if (error) {
      console.error('Error marking scripting as incomplete:', error);
      return;
    }

  }



  const addSlide = (index: number) => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: 'New Slide',
      type: 'content',
      content: 'New slide content',
      notes: ''
    };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
  };

  const handleSave = async () => {
    if (!currentWebinarId) return;

    setIsSaving(true);
    try {
      await slidesDB.saveSlides(currentWebinarId,
        slides.map((slide, index) => ({
          title: slide.title,
          content: slide.content,
          order_index: index,
          type: slide.type,
          notes: slide.notes,
        }))
      );
      toast.success('Slides have been saved');

      // window.location.href = '/';
    } catch (err) {
      setError('Failed to save slides. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <Loader2 className="w-12 h-12 text-teal-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Generating Your Webinar</h3>
            <p className="text-gray-400">Creating professional slides with AI assistance...</p>
          </div>
        </div>

        <ProgressBar
          current={currentGeneratingIndex}
          total={totalSlides}
        />

        <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
          <h4 className="font-medium text-white mb-2">Generation Steps:</h4>
          <ul className="space-y-2">
            <li className={`flex items-center space-x-2 ${currentGeneratingIndex >= 1 ? 'text-teal-400' : ''}`}>
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">
                {currentGeneratingIndex >= 1 ? '✓' : '1'}
              </span>
              <span>Introduction Slide</span>
            </li>
            <li className={`flex items-center space-x-2 ${currentGeneratingIndex >= 2 ? 'text-teal-400' : ''}`}>
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">
                {currentGeneratingIndex >= 2 ? '✓' : '2'}
              </span>
              <span>Agenda Overview</span>
            </li>
            <li className={`flex items-center space-x-2 ${currentGeneratingIndex > 2 ? 'text-teal-400' : ''}`}>
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">
                {currentGeneratingIndex > 2 ? '✓' : '3'}
              </span>
              <span>Content Slides ({Math.max(0, currentGeneratingIndex - 2)} of {totalSlides - 2})</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-red-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Error Generating Slides</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Slides'}</span>
        </button>

        <button
          onClick={() => regenerateSlides()}
          className="flex items-center space-x-2 mx-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        > <RefreshCw className="mr-2 w-5 h-5" /> Generate Again </button>

      </div>

      <Reorder.Group axis="y" values={slides} onReorder={setSlides} className="space-y-4">
        {slides.map((slide, index) => (
          <React.Fragment key={slide.id}>
            <Reorder.Item value={slide} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <GripVertical className="w-5 h-5 text-gray-500 cursor-move mt-2" />
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    {/* Title input - always shown */}
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
                      className={`flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg ${slide.type === 'agenda' ? 'cursor-not-allowed' : ''
                        }`}
                      readOnly={slide.type === 'agenda'}
                      placeholder="Slide Title"
                    />
                    <select
                      value={slide.type}
                      onChange={(e) =>
                        setSlides(
                          slides.map((s) =>
                            s.id === slide.id ? { ...s, type: e.target.value as Slide['type'] } : s
                          )
                        )
                      }
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg"
                    >
                      <option value="intro">Intro</option>
                      <option value="agenda">Agenda</option>
                      <option value="content">Content</option>
                    </select>
                  </div>

                  {/* Subtitle for Intro slides */}
                  {slide.type === 'intro' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={slide.content || ''}
                        onChange={(e) =>
                          setSlides(
                            slides.map((s) =>
                              s.id === slide.id ? { ...s, subtitle: e.target.value } : s
                            )
                          )
                        }
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                        placeholder="Enter an engaging subtitle..."
                      />
                    </div>
                  )}

                  {/* Content for Agenda and Content slides */}
                  {(slide.type === 'agenda' || slide.type === 'content') && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">
                        {slide.type === 'agenda' ? 'Topics' : 'Content'}
                      </label>
                      {slide.type === 'agenda' ? (
                        <div className="space-y-2 bg-gray-700 p-4 rounded-lg">
                          {slide.content?.split('\n').map((topic, i) => (
                            <div key={i} className="flex items-center space-x-2 text-white">
                              <span className="text-teal-400 font-medium">{i + 1}.</span>
                              <span>{topic}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          value={slide.content || ''}
                          onChange={(e) =>
                            setSlides(
                              slides.map((s) =>
                                s.id === slide.id ? { ...s, content: e.target.value } : s
                              )
                            )
                          }
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                          rows={4}
                          placeholder="What should be covered in this slide..."
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">
                      Speaking Notes
                    </label>
                    <textarea
                      value={slide.notes}
                      onChange={(e) =>
                        setSlides(
                          slides.map((s) =>
                            s.id === slide.id ? { ...s, notes: e.target.value } : s
                          )
                        )
                      }
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                      rows={2}
                      placeholder="Notes and delivery tips..."
                    />
                  </div>
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
    </div>
  );
}