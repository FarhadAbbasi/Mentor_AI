import React, { useState, useEffect } from 'react';
import { Brain, ChevronDown, Plus } from 'lucide-react';
import { useWebinarStore } from '../../stores/webinarStore';
import { useWebinar } from '../../hooks/useWebinar';
import { useAuthStore } from '../../stores/authStore';
import { UserMenu } from './UserMenu';
import * as webinarDB from '../../lib/database/webinar';

interface HeaderProps {
  onManageKnowledge: () => void;
}

export function Header({ onManageKnowledge }: HeaderProps) {
  const { user } = useAuthStore();
  const { 
    knowledgeBase, 
    isGenerating, 
    currentWebinarId, 
    setCurrentWebinarId,
    initializeWebinar 
  } = useWebinarStore();
  const { createFirstWebinar } = useWebinar();
  const [webinars, setWebinars] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const hasKnowledge = Boolean(knowledgeBase);

  useEffect(() => {
    if (!user) return;

    const fetchWebinars = async () => {
      setLoading(true);
      try {
        const userWebinars = await webinarDB.getWebinars(user.id);
        setWebinars(userWebinars);
        
        if (userWebinars.length === 0) {
          const webinar = await createFirstWebinar();
          if (webinar) {
            setWebinars([webinar]);
            setCurrentWebinarId(webinar.id);
            await initializeWebinar(webinar.id);
          }
        } else if (!currentWebinarId) {
          setCurrentWebinarId(userWebinars[0].id);
          await initializeWebinar(userWebinars[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch webinars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebinars();
  }, [user, currentWebinarId, setCurrentWebinarId, createFirstWebinar, initializeWebinar]);

  // Update webinar list when knowledge base changes
  useEffect(() => {
    if (knowledgeBase?.webinarSummary?.name && currentWebinarId) {
      setWebinars(prev => 
        prev.map(w => 
          w.id === currentWebinarId 
            ? { ...w, name: knowledgeBase.webinarSummary.name } 
            : w
        )
      );
    }
  }, [knowledgeBase, currentWebinarId]);

  const handleWebinarChange = async (webinarId: string) => {
    setCurrentWebinarId(webinarId);
    await initializeWebinar(webinarId);
    setIsOpen(false);
  };

  const handleCreateWebinar = async () => {
    if (!user) return;
    try {
      const webinar = await webinarDB.createWebinar(user.id);
      setWebinars(prev => [...prev, webinar]);
      setCurrentWebinarId(webinar.id);
      await initializeWebinar(webinar.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create webinar:', error);
    }
  };

  const currentWebinar = webinars.find(w => w.id === currentWebinarId);

  if (loading) {
    return (
      <div className="flex justify-between items-center mb-8 bg-black p-4 rounded-lg animate-pulse">
        <div className="h-10 bg-gray-800 rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center mb-8 bg-black p-4 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors min-w-[200px]"
          >
            <span className="flex-1 text-left truncate">
              {currentWebinar?.name || 'Select Webinar'}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
              {webinars.map((webinar) => (
                <button
                  key={webinar.id}
                  onClick={() => handleWebinarChange(webinar.id)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                    webinar.id === currentWebinarId ? 'bg-gray-700 text-white' : 'text-gray-300'
                  }`}
                >
                  {webinar.name}
                </button>
              ))}
              <button
                onClick={handleCreateWebinar}
                className="w-full px-4 py-2 text-left text-teal-400 hover:bg-gray-700 transition-colors flex items-center space-x-2 border-t border-gray-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Webinar</span>
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={onManageKnowledge}
          disabled={!hasKnowledge || isGenerating}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            hasKnowledge 
              ? 'bg-teal-600 hover:bg-teal-700 text-white' 
              : 'bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Brain className="w-5 h-5" />
          <span>{isGenerating ? 'Generating...' : 'Manage Knowledge'}</span>
        </button>
      </div>
      <UserMenu />
    </div>
  );
}