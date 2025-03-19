import React from 'react';
import { MessageSquare, X, Send, Loader2, Bug, HelpCircle, Wand2, FileQuestion, ChevronRight } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import OpenAI from 'openai';
import { useState, useRef, useEffect } from 'react';
import { useWebinarStore } from '../../stores/webinarStore';
import { toast, ToastContainer } from 'react-toastify';
import { WebinarData } from '../../types/webinar';

interface HighlightInfo {
  selector: string;
  message: string;
}

interface NavigationInfo {
  path: string;
  highlight?: HighlightInfo | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationStarter {
  icon: React.ReactNode;
  text: string;
  prompt: string;
}



export default function Chatbot() {

  const [isOpen, setIsOpen] = useState(false);
  // const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hey, I'm Casper, the friendly ghost... No, i am an AI Assistant here to help you navigate the app. How can I assist you today?"
  }]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketButton, setShowTicketButton] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isBugReport, setIsBugReport] = useState(false);
  const [isGeneralQuestion, setIsGeneralQuestion] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [hasBugIntent, setHasBugIntent] = useState(false);
  const [showNavigationButton, setShowNavigationButton] = useState<{
    destination: string;
    highlight: HighlightInfo | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeHighlight, setActiveHighlight] = useState<HighlightInfo | null>(null);
  const { user } = useAuthStore();
  const [suggestedStep, setSuggestedStep] = useState<string | null>('');
  const { generateKnowledgeBase, triggerNextStep, presentStep } = useWebinarStore();
  
  

  // Navigation mappings with highlight information
  const navigationGuides: Record<string, NavigationInfo> = {
    'automations_create': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="automations"]',
        message: 'Click here to open automations. The Create New button will appear to set up your automation.'
      }
    },
    'dashboard': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="headset"]',
        message: 'Click here to create an AI influencer - choose between instant generation or professional voice cloning'
      }
    },
    'videos': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="videos-button"]',
        message: 'Click the Videos button to view and manage all videos for this influencer'
      }
    },
    'looks': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="looks-button"]',
        message: 'Click the Looks button to manage different appearances for your influencer'
      }
    },
    'record': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="record-button"]',
        message: 'Click the Record button to create a new video with this influencer'
      }
    },
    'settings': {
      path: '/settings',
      highlight: {
        selector: '[data-tour="settings"]',
        message: 'Here you can manage your API keys and account settings'
      }
    },
    'planner': {
      path: '/planner',
      highlight: {
        selector: '[data-tour="calendar"]',
        message: 'Use the content planner to create multiple videos at once'
      }
    },
    'automations': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="automations"]',
        message: 'Access your automation settings to integrate with external services'
      }
    },
    'content': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="content-button"]',
        message: 'Click here to manage and create videos for your influencer'
      }
    }
  };

  // Handle highlight cleanup
  useEffect(() => {
    if (activeHighlight) {
      const element = document.querySelector(activeHighlight.selector);
      if (element) {
        // Scroll element into view when highlight is added
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        element.classList.add(
          'ring-4',
          'ring-[#c9fffc]',
          'ring-opacity-100',
          'animate-pulse',
          'z-[60]'
        );
      }

      return () => {
        if (element) {
          element.classList.remove(
            'ring-4',
            'ring-[#c9fffc]',
            'ring-opacity-100',
            'animate-pulse',
            'z-[60]'
          );
        }
      };
    }
  }, [activeHighlight]);

  
  const conversationStarters: ConversationStarter[] = [
    {
      icon: <Bug className="h-5 w-5" />,
      text: "Report a Bug",
      prompt: "I'd like to report a bug I encountered in the app."
    },
    {
      icon: <Wand2 className="h-5 w-5" />,
      text: "AI Avatar Help",
      prompt: "How do I create an AI avatar or clone my voice?"
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      text: "App Navigation",
      prompt: "Can you help me navigate through the app's features?"
    },
    {
      icon: <FileQuestion className="h-5 w-5" />,
      text: "Feature Request",
      prompt: "I have some general questions about the platform."
    }
  ];

  // ... (keep existing systemPrompt)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);




  useEffect(() => {
    // Show ticket button after 3 messages from user
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    if ((userMessageCount >= 1 && hasBugIntent) || isBugReport || isGeneralQuestion) {
      setShowTicketButton(true);
    }
  }, [messages, isBugReport, hasBugIntent, isGeneralQuestion]);

 const systemPrompt =  `You are an AI assistant for Mentor AI website helping users create webinars step by step and aslo helping them with anything they ask. 

  ### General Guidelines:
  - Provide **clear and concise explanations** when users ask about specific features.
  - **Guide users** through the webinar creation process **logically and step-by-step**.
  - Always **suggest the next step** to keep them progressing smoothly.
  - Strictly follow the response formats, specially the text "delimited by <>".
  - Do not say "we are creating/generating slides etc" or "knowledgeBase generation is under process", but rather always culminate your response with text/commands delimited by <>, to help user click "YES" on pop-up to render the step/process. 
  - Do not forget to include the text/commands delimited by <>.

      

  ### Next Step Suggestion Guidelines:
  For Next Step Suggestion in your responses, you would strictly use following commands/phrases delimited by <>. Never miss these phrases i.e "RENDER: (suggestedNextStep)" at the end of your response when suggesting next step. Use exactly following phrases, as these phrases will be "extracted" through string parsing to create a pop-up for user to click "YES" as well as to render/call relevent functions:

  Correct format of Phrases to use:
<  RENDER: createWebinar >
<  RENDER: generateKnowledgeBase >
<  RENDER: generateSlides >
<  RENDER: generateScript >


   ### Handling User Questions:
  - If a user asks about **creating a webinar**, explain:  
    "You can create a webinar manually or let AI generate everything for you. Just provide a title, and AI will handle the rest!"  
    Then move on asking for the Title, Description etc using the following Webinar Creation Flow and "RENDER" Commands.



  ### Webinar Creation Flow:
  1. **New Webinar Creation**  
     - Ask/confirm users for a **new webinar creation**
     - Along with asking user, end your response with following command delimited by <>. (It will create a pop-up for user to click "Create New Webinar"):

  <  RENDER: createWebinar >



  2. **Webinar Title & Description**  
     - Once new webinar created, ask users for a **webinar title** and tell them you will ask 4 more short questions/details.
     - Then ask for **following details** (if any detail is not provided or not generated by ai(you), assign "none" as a value to it) :

      a. Description (One line)
      b. Topics (at least one topic, covered in this webinar)
      c. Product'/service   (What offer are you making in the webinar)
      d. Bonuses  (bonuses for viewers of webinar)
      e. Value  (the value the viewer will get by listening to your webinar.)


  3.  **Confirm Detials**  
     - Once Details provided by user, Ask for any changes/confirmation regarding the Webinar Details. (Do not use "RENDER: generateKnowledgeBase" during confirmation) 
     
  4.  **Submit Detials and Generate KnowledgeBase**  
     
     - Once Details Confirmed, Explain that now **knowledge base** will be generated which helps AI generate relevant content for webinar.  
     - then end your response strictly with following "Correct Response" delimited by <>. It will create a pop-up for user to finally Submit/Save Details to generate KnowledgeBase. Do not use any other formats for response (an example of incorrect Response is given below):

    - Incorrect Response:
      **Title**: title
      **Description**: description

    - Correct Response:
<      TITLE: "title "
       DESCRIPTION: "description" 
       TOPICS: "topics"
       PRODUCT: "Product"
       BONUSES: "Bonus"
       VALUE: "value"

   RENDER: generateKnowledgeBase >


  5. **Generating Slides**  
    - Once knowledgeBase generated with prev response: 
     a. Inform users that now AI will generate slides based on the knowledge-base.  
     b. then end your response with following command delimited by <>: (It will create a pop-up for user to generate Slides):

<   RENDER: generateSlides >
  

  6. **Saving Slides**  
    - Once slides generated with prev response: 
    Inform User that he has been navigated to Slides Section and he needs to Save Slides. He can also edit slides. 



  7. **Generating Webinar Script**  
    - Once Slides saved: 
     a. Inform users that now AI will generate a structured script based on slides.  
     b. then end your response with following command delimited by <>: (It will create a pop-up for user to navigate to Script Section):

<   RENDER: generateScript >


  8. **Final Review**  
    - Once Step 6 is done: 
    Inform User that he has been navigated to Script Section and he needs to generate script manually for each slide. 
    Also inform User that they need to select Avatar and themes manually from the relevent section.
    Inform the user that they should finally visit Webinar Section for final review**.
  

  
  ### If a user seems confused, **reassure them** and summarize where they are in the process.
  ### If user seem unresponsive/stuck, ask him if he wants you to regerate previous response again to **RE-RENDER** previous step.
  ### Response Formatting:
  - Keep responses **short, friendly, and professional**.
  - Always suggest the next step **only when relevant**.
  - If no step is needed, just provide an explanation.
  - always keep track of the steps.
  ### If user ask to do/perform something about Webinars which you're not aware about, then guide them and tell them they can do it manually.

  ### Reminder:
  - Strictly follow the response formats, specially the text "delimited by <>".
  - Do not forget to include the text/commands delimited by <>.
  
  `



  //----------------------------------  HANDLE Webinar Creation Steps  -------------------------->>

  const proceedToNextStep = () => {
    console.log('suggested step :', suggestedStep);
    if(suggestedStep === "generateKnowledgeBase") generateKnowledgeBaseWithAI(); 
    triggerNextStep(suggestedStep); 
    setSuggestedStep(null);
    setInput('Current Step Done!');
    // ()=> handleSubmit;
  }


// Handle AI Suggested Steps For Webinar Creation

  const handleTriggerNextStep = async (response: string) => {
    const match = response.match(/RENDER: (\w+)/); // Extract next step
    const nextStep = match ? match[1] : null;
    console.log('Next Step is =', nextStep);
    if (nextStep) {
      setSuggestedStep(nextStep);
      toast.success(`Next Step is: ${nextStep}`);
    }
    if(nextStep === "generateKnowledgeBase") extractWebinarDetails(response);

    const [cleanResponse] = response.split("RENDER:");
    console.log('Clean response:', cleanResponse);
    setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
  };

  // console.log('suggested step:', suggestedStep);
  // console.log('present step:', presentStep);


const [webinarDetails, setWebinarDetails] = useState <WebinarData>({
  description: "",
  topics: [],
  product: null,
  bonuses: [],
  value: "",
  avoidTopics: "",
});
const extractWebinarDetails = (message: any) => {
  if (!message) return

  // const regex = /TITLE:\s*"([^"]*)"\s*DESCRIPTION:\s*"([^"]*)"\s*TOPICS:\s*"([^"]*)"\s*PRODUCT:\s*"([^"]*)"\s*BONUSES:\s*"([^"]*)"\s*VALUE:\s*"([^"]*)"/;
  const regex = /TITLE:\s*"([^"]+)"[\s\S]*?DESCRIPTION:\s*"([^"]+)"[\s\S]*?TOPICS:\s*"([^"]+)"[\s\S]*?PRODUCT:\s*"([^"]+)"[\s\S]*?BONUSES:\s*"([^"]+)"[\s\S]*?VALUE:\s*"([^"]+)"/;
  const details = message.match(regex);
  console.log("Extractied Details:", details);

  if (message) console.log("Extractied Details:", details);

  if (details) {
    setWebinarDetails({
      description: details[1],
      topics: details[2].split(","), // Convert to array
      product: details[3],
      bonuses: details[4],
      value: details[5],
      avoidTopics: "",
    });
  }


// // Helper function to extract values based on a key
// const extractValue = (text: string, key: string) => {
//   const match = text.match(new RegExp(`${key}:\\s*"([^"]+)"`));
//   return match ? match[1] : "Not found";
// };
// // Extract each detail separately
// const details  = {
//   title: extractValue(message, "TITLE"),
//   description: extractValue(message, "DESCRIPTION"),
//   topics: extractValue(message, "TOPICS"),
//   product: extractValue(message, "PRODUCT"),
//   bonuses: extractValue(message, "BONUSES"),
//   value: extractValue(message, "VALUE"),
// };

// console.log("Extractied Details:", details);

//   if (details) {
//     setWebinarDetails({
//       description: details.description,
//       topics: details.topics.split(","), // Convert to array
//       product: details.product,
//       bonuses: details.bonuses,
//       value: details.value,
//       avoidTopics: "",
//     });
//   }

};

  //-----------------------------   Generate KnowledgeBase with Chatbot ------------------------->>

  const generateKnowledgeBaseWithAI = async () => {
    console.log('FINAL Webinar Details are :', webinarDetails);

    const { description, topics, value, product, bonuses,  } =  webinarDetails ;
    if (!description.trim()) {
      toast.error('Please provide a description of your webinar');
      return;
    }
    if (topics.length === 0) {
      toast.error('Please add at least one topic');
      return;
    }
    if (!value.trim()) {
      toast.error('Please describe the value viewers will get');
      return;
    }

    toast.success('KnowledgeBase Generated with AI');
    await generateKnowledgeBase({
      description,
      topics,
      value,
      product,
      bonuses,
      avoidTopics: '',
    });
  };




// _______________________________________  THIS IS UN_USED CODE _________________________________>>

  const handleNavigation = (response: string) => {
    const navigationMatch = response.match(/NAVIGATE_TO: ([\w-]+)/);
    if (navigationMatch) {
      const destination = navigationMatch[1];
      const cleanResponse = response.replace(/NAVIGATE_TO: [\w-]+/, '').trim();

      setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);

      // Show navigation button
      setShowNavigationButton({
        destination,
        highlight: navigationGuides[destination]?.highlight || null
      });

      return;
    }

    // If no navigation, just add the message
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };

  const handleNavigationClick = () => {
    if (!showNavigationButton) return;

    const { destination, highlight } = showNavigationButton;
    const path = navigationGuides[destination]?.path || `/${destination}`;

    setIsOpen(false);
    setShowNavigationButton(null);

    // navigate(path);

    // Helper function to scroll element into view
    const scrollToElement = (selector: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };



    if (destination === 'automations_create') {
      setTimeout(() => {
        const automationsButton = document.querySelector('[data-tour="automations"]');
        if (automationsButton instanceof HTMLElement) {
          scrollToElement('[data-tour="automations"]');
          automationsButton.click();
        }
        if (highlight) {
          setActiveHighlight(highlight);
          setIsOpen(true);
        }
      }, 500);
      return;
    }

    setTimeout(() => {
      if (highlight) {
        scrollToElement(highlight.selector);
        setActiveHighlight(highlight);
        setIsOpen(true);
      }
    }, 500);
  };
// _______________________________________  THIS IS UN_USED CODE _________________________________<<




const checkBugIntent = (message: string) => {
    const bugKeywords = [
      'bug', 'issue', 'problem', 'error', 'broken', 'not working',
      'doesn\'t work', 'failed', 'crash', 'glitch', 'malfunction'
    ];

    const lowercaseMessage = message.toLowerCase();
    return bugKeywords.some(keyword => lowercaseMessage.includes(keyword));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!input.trim() || !user?.openaiApiKey) return;
    if (!input.trim() || !user) return;

    // For bug reports or general questions, format the message nicely
    if ((isBugReport || isGeneralQuestion) && messages.length > 2) {
      setMessages(prev => [...prev, { role: 'user', content: input.trim() }]);
      setInput('');
      return;
    }

    // Initial message for bug report or general question
    if (isBugReport || isGeneralQuestion) {
      setMessages(prev => [...prev,
      { role: 'user', content: input.trim() },
      {
        role: 'assistant', content: isBugReport
          ? "Thank you for reporting this bug. Could you please provide any additional details or steps to reproduce the issue?"
          : "Thank you for your question. Could you please provide more details about what you'd like to know?"
      }
      ]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Check for bug intent in user message
    if (checkBugIntent(userMessage)) {
      setHasBugIntent(true);
    }

    setIsLoading(true);

    try {
      const openai = new OpenAI({
        // apiKey: user.openaiApiKey,
        apiKey: import.meta.env.VITE_OPEN_AI_KEY,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at this time.';
      // handleNavigation(assistantMessage);
      handleTriggerNextStep(assistantMessage);
      console.log('Assistant Message: ', assistantMessage);


    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterClick = (prompt: string) => {
    if (prompt === "I'd like to report a bug I encountered in the app.") {
      setIsBugReport(true);
      setIsGeneralQuestion(false);
      setShowBackButton(true);
      setInput("");
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Please describe the bug you encountered and any steps to reproduce it:"
      }]);
      return;
    } else if (prompt === "I have some general questions about the platform.") {
      setIsGeneralQuestion(true);
      setIsBugReport(false);
      setShowBackButton(true);
      setInput("");
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Please explain what you'd like to know about the platform:"
      }]);
      return;
    }
    setInput(prompt);
  };

  const handleBackToChat = () => {
    setIsBugReport(false);
    setIsGeneralQuestion(false);
    setShowBackButton(false);
    setShowTicketButton(false);
    setMessages([{
      role: 'assistant',
      content: "Hey, I'm Casper, the friendly Demon... No i am an AI Assistant here to help you navigate the app. How can I assist you today?"
    }]);
  };

  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhookUrl();
  }, []);

  const fetchWebhookUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('support_webhook')
        .select('url')
        .single();

      if (error) throw error;
      if (data) {
        setWebhookUrl(data.url);
      }
    } catch (err) {
      console.error('Error fetching webhook URL:', err);
    }
  };

  const handleCreateTicket = async () => {
    if (!user) return;

    setIsCreatingTicket(true);
    try {
      // Create support ticket
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: user.id,
            conversation: messages,
            status: 'open'
          }
        ]);

      if (error) throw error;

      // Send webhook notification through backend if URL is configured
      if (webhookUrl) {
        try {
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/submitsupportticket`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_email: user.email,
              conversation: messages,
              webhook_url: webhookUrl,
              created_at: new Date().toISOString()
            })
          });
        } catch (webhookError) {
          console.error('Failed to send webhook:', webhookError);
          // Continue with success message even if webhook fails
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Support ticket created successfully! Our team will review your conversation and get back to you soon.'
      }]);
      setShowTicketButton(false);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error creating your support ticket. Please try again later.'
      }]);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  if (!user) return null;

  return (
    <>
    <ToastContainer/>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-tour="chatbot"
          className="fixed bottom-6 right-6 bg-teal-500 text-black rounded-full p-3 shadow-lg hover:bg-teal-400 transition-colors"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl z-50 ${activeHighlight ? 'hidden' : ''}`}>
          <div className="flex justify-between items-center p-4 bg-teal-600 rounded-t-lg">
            <h3 className="font-semibold text-white">Mentor - AI Support</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                {message.role === 'assistant' && (
                  <img
                    src="https://i.ibb.co/bP07W7D/BLURED-GPTBOLTELLEVENLABS-8.png"
                    alt="AI Assistant"
                    className="h-8 w-8 bg-black rounded-full mr-2 object-cover"
                  />
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 whitespace-pre-wrap ${message.role === 'user'
                    ? 'bg-[#c9fffc] text-black'
                    : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {showNavigationButton && (
              <div className="flex justify-center my-4">
                <button
                  onClick={handleNavigationClick}
                  className="flex items-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  Show me how
                </button>
              </div>
            )}

            {messages.length === 1 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {conversationStarters.map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => handleStarterClick(starter.prompt)}
                    className="flex items-center gap-2 p-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {starter.icon}
                    <span>{starter.text}</span>
                  </button>
                ))}
              </div>
            )}


            {suggestedStep && (
              <div className='p-2 flex relative shadow right-0 bottom-0'>
                <p>Next Step: {suggestedStep}. Do you want to proceed?</p>
                <button 
                className="flex items-center space-x-2 mx-2 px-2 py- bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                onClick={ proceedToNextStep }>Yes</button>
                <button  className="flex items-center space-x-2 mx-2 px-2 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                onClick={ ()=> { setSuggestedStep(null); setInput('Not yet, Thanks') } }>No</button>
              </div>
            )}



            {isLoading && (
              <div className="flex justify-start">
                <img
                  src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
                  alt="AI Assistant"
                  className="h-8 w-8 rounded-full mr-2 object-cover"
                />
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showTicketButton && (
            <div className="px-4 py-2 border-t border-gray-100">
              <div className="flex flex-col gap-2">
                {showBackButton && (
                  <button
                    onClick={handleBackToChat}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back to Chat
                  </button>
                )}
                <button
                  onClick={handleCreateTicket}
                  disabled={isCreatingTicket}
                  // className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {isCreatingTicket ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Ticket...
                    </>
                  ) : (
                    <>
                      <Bug className="h-5 w-5" />
                      {isBugReport ? 'Submit Bug Report' : 'Submit Feature Request'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isBugReport ? "Describe your bug here..." :
                    isGeneralQuestion ? "Explain your feature here..." :
                      "Ask me anything about the app..."
                }
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
              {!isBugReport && !isGeneralQuestion && <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#c9fffc] text-black rounded-lg px-4 py-2 hover:bg-[#a0fcf9] disabled:opacity-50 disabled:cursor-not-allowed"

              >
                <Send className="h-5 w-5" />
              </button>}
            </div>
          </form>
        </div>

      )}
      {activeHighlight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[59]">
          <div
            className="fixed bg-white rounded-lg p-6 shadow-lg z-[61] max-w-md w-full text-center"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex flex-col items-center gap-6">
              <p className="text-gray-900 text-lg">{activeHighlight.message}</p>
              <button
                onClick={() => {
                  setActiveHighlight(null);
                  setIsOpen(true);
                }}
                className="px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}









// const systemPrompt = `You are Casper, an AI assistant for the Mentor Webinar platform. You can help users navigate the app and explain features.

// When users ask about specific features, you should:
// 1. Provide a clear explanation
// 2. Guide them about the relevent process
// 3. Suggest them the next Steps for Webinar Creation

// For Next Step Suggestion, you can use (use exactly these phrases):
// - TRIGGER: generateTitle
// - TRIGGER: generateKnowledgeBase
// - TRIGGER: generateSlides
// - TRIGGER: generateScript

// When user clicks/agrees to the start creating Webinar, Keep suggesting the next STEP/TRIGGER function to proceed with webinar creation untill the last STEP. THese Steps will  Then user will be directed to the Final Submission Page.


// Key features to explain:
// 1. Creating Webinars:
//    - Generate Webinar using our advanced AI system
//    - Explain they can create webinar manually as well as with AI Assistant's (your) help
//    - Ask them provide the Title of the Webinar
//    - Also ask for 1 line description for webinar (optional)
   

// Example responses:

// If user asks about creating creating a webinar:
// "You have two options for creating an Mentor Webinar:
// 1. Create the Webinar manually from Webinar Page by providing custom description, content and scripts.
// 2. Ask AI to start creating webinar automatically. Just enter your Webinar Name/Title here and AI will do the rest...

//  TRIGGER: generateKnowledgeBase



// If user asks about automations:
// "Our automation system lets you integrate with external services using webhooks.

// NAVIGATE_TO: automations



// Keep responses friendly and helpful. Always offer to explain more if needed.`;










// const systemPrompt = `You are Casper, an AI assistant for the AI Influencer platform. You can help users navigate the app and explain features.

// When users ask about specific features, you should:
// 1. Provide a clear explanation
// 2. Guide them to the relevant page
// 3. Explain how to use the feature

// Navigation commands you can use (use exactly these phrases):
// - NAVIGATE_TO: dashboard
// - NAVIGATE_TO: settings
// - NAVIGATE_TO: planner
// - NAVIGATE_TO: automations
// - NAVIGATE_TO: automations_create
// - NAVIGATE_TO: content
// - NAVIGATE_TO: videos
// - NAVIGATE_TO: looks
// - NAVIGATE_TO: record

// Key features to explain:
// 1. Creating AI Avatars:
//    - Explain there are two options:
//      a) Generate custom AI avatar using our advanced AI system
//      b) Schedule a call for professional AI voice cloning
//    - Direct them to click the "+" button on dashboard
//    - Mention voice customization options

// 2. Content Creation:
//    - Explain they can create individual videos or use bulk creation
//    - Direct them to the content page for single videos
//    - Mention the planner for bulk content creation
//    - Each influencer card has three main actions:
//      a) Videos: View and manage all videos
//      b) Looks: Manage different appearances
//      c) Record: Create a new video

// 3. Automations:
//    - Explain webhook functionality for integration
//    - Direct them to the automations panel in the layout
//    - Two types of automations:
//      1. Incoming Webhooks:
//         - Create videos programmatically via API
//         - Perfect for integrating with your existing tools
//         - Automatically generate videos based on your data
//      2. Outgoing Automations:
//         - Get notified when videos are completed
//         - Send video data to your systems
//         - Trigger workflows when videos are ready
//    - Both types can be created from the Create New button in automations

// Example responses:

// If user asks about creating an influencer:
// "You have two options for creating an AI influencer:
// 1. Generate a custom AI avatar using our advanced AI system - this lets you customize appearance and voice
// 2. Schedule a call with our team for professional AI voice cloning

// NAVIGATE_TO: dashboard

// On the dashboard, click the + button to start. You can choose between generating an avatar instantly or scheduling a call for voice cloning."

// If user asks about content creation:
// "You can create content in two ways:
// 1. Individual videos through the content page
// 2. Bulk creation using our content planner

// NAVIGATE_TO: content

// Click the Content button on any influencer card to start creating videos. For bulk creation, use the calendar icon in the top right."

// If user asks about automations:
// "Our automation system lets you integrate with external services using webhooks.

// NAVIGATE_TO: automations

// You can set up:
// 1. Incoming webhooks to create videos via API
// 2. Outgoing webhooks to get notifications when videos are ready"

// Keep responses friendly and helpful. Always offer to explain more if needed.`;
