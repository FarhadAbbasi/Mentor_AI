import React, { useEffect, useState } from 'react';
import { Presentation, BarChart3, Megaphone, Brain } from 'lucide-react';
import { DashboardCard } from './components/dashboard/DashboardCard';
import { WebinarCreation } from './components/webinar/WebinarCreation';
import { KnowledgeBase } from './components/webinar/knowledgebase/KnowledgeBase';
import { NavigationMenu } from './components/navigation/NavigationMenu';
import { useWebinarStore } from './stores/webinarStore';
import { useAuthStore } from './stores/authStore';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthForm } from './components/auth/AuthForm';
import { supabase } from './lib/supabase';
import { checkAdminStatus } from './lib/auth';
import Chatbot from './components/Chatbot/Chatbot';
import Streaming from './components/Chatbot/Streaming';

export const ADMIN_PATH = '/admin';

export default function App() {
  const [activeSection, setActiveSection] = React.useState<'dashboard' | 'webinar' | 'knowledge'>('dashboard');
  const { presentStep, knowledgeBase, isGenerating } = useWebinarStore();
  const { user, isAdmin } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  // const [currentStep, setCurrentStep] = useState<string | null>(presentStep);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useAuthStore.setState({
          user: session.user,
          isAdmin: checkAdminStatus(session.user)
        });
      }
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.setState({
        user: session?.user ?? null,
        isAdmin: checkAdminStatus(session?.user ?? null)
      });
    });

    return () => subscription.unsubscribe();
  }, []);



  // Components Rendering for Chatbot triggered functions
    useEffect(() => {
    // console.log('PRESENT Step in APP useEffect: ', presentStep);
    const renderSectionForChatbot = () => {
      if (presentStep === "askDetails" || presentStep === "generateKnowledgeBase")
        setActiveSection('knowledge');
      if (presentStep === "generateSlides" || presentStep === "generateScript")
        setActiveSection('webinar');
    }
    renderSectionForChatbot();
  }, [presentStep]);





  if (!initialized) {
    return null;
  }

  if (!user) {
    return <AuthForm />;
  }

  // Show admin dashboard if we're on the admin path and user is admin
  if (window.location.pathname === ADMIN_PATH && isAdmin) {
    return <AdminDashboard />;
  }



  // Redirect non-admin users away from admin path
  if (window.location.pathname === ADMIN_PATH && !isAdmin) {
    window.location.href = '/';
    return null;
  }
  const dashboardItems = [
    {
      title: 'Set-Up',
      description: 'Create your webinar knowledge base with AI',
      icon: Brain,
      onClick: () => setActiveSection('knowledge'),
      disabled: false,
      status: knowledgeBase ? 'completed' : isGenerating ? 'generating' : 'not-started',
    },
    {
      title: 'Webinar Creation',
      description: 'Create engaging webinars with AI-powered tools',
      icon: Presentation,
      onClick: () => setActiveSection('webinar'),
      disabled: !knowledgeBase,
      status: 'not-started',
    },
    {
      title: 'Strategy Builder',
      description: 'Develop comprehensive marketing strategies',
      icon: BarChart3,
      onClick: () => { },
      disabled: true,
      status: 'not-started',
    },
    {
      title: 'Advertising Studio',
      description: 'Create and manage your advertising campaigns',
      icon: Megaphone,
      onClick: () => { },
      disabled: true,
      status: 'not-started',
    },
  ];




  const renderContent = () => {
    switch (activeSection) {
      case 'knowledge':
        return (
          <div>
            <button
              onClick={() => setActiveSection('dashboard')}
              className="mb-6 text-teal-400 hover:text-teal-300 font-medium flex items-center"
            >
              ← Back to Dashboard
            </button>
            <KnowledgeBase onComplete={() => setActiveSection('dashboard')} />
          </div>
        );
      case 'webinar':
        return (
          <div>
            <button
              onClick={() => setActiveSection('dashboard')}
              className="mb-6 text-teal-400 hover:text-teal-300 font-medium flex items-center"
            >
              ← Back to Dashboard
            </button>
            {/* <WebinarCreation  /> */}
            <WebinarCreation onComplete={() => setActiveSection('dashboard')} />
          </div>
        );
      default:
        return (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mt-2">
                Select a tool to start creating your webinar content
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {dashboardItems.map((item) => (
                <DashboardCard key={item.title} {...item} />
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationMenu onManageKnowledge={() => setActiveSection('knowledge')} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderContent()}

        {/* <div className='m-10 bg-slate-400'>
          <Streaming />
        </div> */}
        
        <Chatbot />
      </div>
    </div>
  );
}