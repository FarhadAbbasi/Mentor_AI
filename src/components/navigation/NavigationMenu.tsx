import React, { useState, useEffect } from 'react';
import { Brain, LayoutDashboard, LogOut, Menu, X, ChevronDown, Plus, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { checkAdminStatus } from '../../lib/auth';
import { useWebinarStore } from '../../stores/webinarStore';
import { useWebinar } from '../../hooks/useWebinar';
import * as webinarDB from '../../lib/database/webinar';
import { toast, ToastContainer } from 'react-toastify';

interface NavigationMenuProps {
  onManageKnowledge: () => void;
}

export default function NavigationMenu({ onManageKnowledge }: NavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWebinarDropdownOpen, setIsWebinarDropdownOpen] = useState(false);
  const { signOut, user, isAdmin } = useAuthStore();
  const showAdminButton = isAdmin;
  const { knowledgeBase, currentWebinarId, presentStep, setCurrentWebinarId, initializeWebinar } = useWebinarStore();
  const { createFirstWebinar } = useWebinar();
  const [webinars, setWebinars] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchWebinars = async () => {
      try {
        const userWebinars = await webinarDB.getWebinars(user.id);
        if (!isMounted) return;

        setWebinars(userWebinars);

        if (userWebinars.length === 0) {
          const webinar = await createFirstWebinar();
          if (webinar && isMounted) {
            setWebinars([webinar]);
            setCurrentWebinarId(webinar.id);
            await initializeWebinar(webinar.id);
          }
        } else if (!currentWebinarId) {
          setCurrentWebinarId(userWebinars[0].id);
          if (isMounted) {
            await initializeWebinar(userWebinars[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch webinars:', error);
      }
    };

    fetchWebinars();

    return () => {
      isMounted = false;
    };
  }, [user, currentWebinarId, setCurrentWebinarId, createFirstWebinar, initializeWebinar]);

  const handleWebinarChange = async (webinarId: string) => {
    setCurrentWebinarId(webinarId);
    await initializeWebinar(webinarId);
    setIsWebinarDropdownOpen(false);
    setIsOpen(false);
  };

  const handleCreateWebinar = async () => {
    if (!user) return;
    try {
      const webinar = await webinarDB.createWebinar(user.id);
      setWebinars(prev => [...prev, webinar]);
      setCurrentWebinarId(webinar.id);
      await initializeWebinar(webinar.id);
      console.log('webinar id:', webinar.id);
      setIsWebinarDropdownOpen(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create webinar:', error);
    }
  };

  // Components Rendering for Chatbot triggered functions
  useEffect(() => {
    // console.log('PRESENT Step in Navigation-Menu: ', presentStep);
    toast.success('Creating Webinar with AI');

    const renderSectionForAI = async () => {
      if (presentStep === "createWebinar")
       await handleCreateWebinar();
    }
    renderSectionForAI();
  }, [presentStep]); // Runs when step changes



  return (
    <>
    <ToastContainer/>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-300" />
        )}
      </button>

      {isOpen && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className="fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-gray-800 z-40 p-4"
        >
          <div className="pt-16 space-y-6">
            <div className="flex justify-center mb-2">
              <img
                src="https://i.ibb.co/bP07W7D/BLURED-GPTBOLTELLEVENLABS-8.png"
                alt="Logo"
                className="h-24 w-auto"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsWebinarDropdownOpen(!isWebinarDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="truncate">
                  {webinars.find(w => w.id === currentWebinarId)?.name || 'Select Webinar'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isWebinarDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWebinarDropdownOpen && (
                <div className="absolute top-full left-0 right-0  mt-2 bg-gray-800 rounded-lg shadow-lg z-50">
                <div className="h-80 mt-2 overflow-auto  shadow-lg z-50">
                  {webinars.map((webinar) => (
                    <button
                      key={webinar.id}
                      onClick={() => handleWebinarChange(webinar.id)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors bg-gray-800 ${webinar.id === currentWebinarId ? 'bg-gray-700 text-white' : 'text-gray-300'
                        }`}
                    >
                      {webinar.name}
                    </button>
                  ))}
                  </div>
                  <button
                    onClick={handleCreateWebinar}
                    className="w-full px-4 py-2 text-left text-teal-400 hover:bg-gray-700 transition-colors border-t border-gray-700 bg-gray-800"
                  >
                    <Plus className="w-4 h-4 inline-block mr-2" />
                    Create New Webinar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  window.location.href = '/';
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={onManageKnowledge}
                disabled={!knowledgeBase}
                className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <Brain className="w-5 h-5" />
                <span>Knowledge Base</span>
              </button>

              {showAdminButton && (
                <button
                  onClick={() => {
                    window.location.pathname = '/admin';
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </button>
              )}
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export { NavigationMenu };