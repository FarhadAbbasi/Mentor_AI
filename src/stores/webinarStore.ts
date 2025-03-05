import { create } from 'zustand';
import { WebinarData, WebinarKnowledgeBase } from '../types/webinar';
import { generateKnowledgeBase as generateKnowledgeBaseAPI } from '../lib/openai';
import * as webinarDB from '../lib/database/webinar';


// const renderQuestionContent = (question: typeof questions[0]) => {  'textarea', topics, product, bonuses,
// const handleComplete = async () => { (In KnowladedgeBase, to save knowledgeBase)
// const regenerateSlides = async () => { (In SlideEditor, to generate Slides )
// const fetchSlides = async () => { (In ScriptingEditor, to fetch slides from supabase)
// const generateScript = async () => { (In ScriptingEditor, to generate scripts for each slide one by one)
// const handleSave = async () => { (In ScriptingEditor, to mark Scripting as "Completed" on supabase)



interface WebinarStore {
  webinarData: WebinarData | null;
  knowledgeBase: WebinarKnowledgeBase | null;
  currentWebinarId: string | null;
  isGenerating: boolean;
  error: string | null;
  showKnowledgeBase: boolean;

  presentStep: string | null;
  // setNextStep: (step: string | null) => void;
  triggerNextStep: (step: keyof typeof STEP_FUNCTIONS) => void;


  setWebinarData: (data: Partial<WebinarData>) => void;
  setCurrentWebinarId: (id: string | null) => void;
  generateKnowledgeBase: (data: WebinarData) => Promise<void>;
  updateKnowledgeBase: (knowledgeBase: WebinarKnowledgeBase) => void;
  updateWebinarName: (name: string) => Promise<void>;
  clearError: () => void;
  setShowKnowledgeBase: (show: boolean) => void;
  initializeWebinar: (webinarId: string) => Promise<void>;
}

const STEP_FUNCTIONS: Record<string, string | null> = {
  createWebinar: "createWebinar",
  // submitDetails: "askDetails",
  generateKnowledgeBase: "generateKnowledgeBase",
  generateSlides: "generateSlides",
  generateScript: "generateScript",
} as const;





export const useWebinarStore = create<WebinarStore>((set, get) => ({
  webinarData: null,
  knowledgeBase: null,
  currentWebinarId: null,
  isGenerating: false,
  error: null,
  showKnowledgeBase: false,

  presentStep: null, // Step to be triggered next


  triggerNextStep: async (step: keyof typeof STEP_FUNCTIONS) => {
    console.log('Step in WebinarStore :', step);
    if (STEP_FUNCTIONS[step]) {
      set({ presentStep: step }); // Update state to reflect new step
    } else {
      console.log("Invalid step");
    }
  },



  setWebinarData: (data) => set((state) => ({
    webinarData: { ...state.webinarData, ...data } as WebinarData,
  })),

  setCurrentWebinarId: (id) => set({ currentWebinarId: id }),

  initializeWebinar: async (webinarId: string) => {
    try {
      const knowledgeBase = await webinarDB.getKnowledgeBase(webinarId);
      set({ knowledgeBase, currentWebinarId: webinarId });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to initialize webinar' });
    }
  },

  generateKnowledgeBase: async (data) => {
    const { currentWebinarId } = get();
    if (!currentWebinarId) {
      set({ error: 'No webinar selected' });
      return;
    }

    set({ isGenerating: true, error: null });
    try {
      const knowledgeBase = await generateKnowledgeBaseAPI(data);

      await Promise.all([
        webinarDB.createKnowledgeBase(currentWebinarId, knowledgeBase),
        webinarDB.updateWebinar(currentWebinarId, {
          name: knowledgeBase.webinarSummary.name
        })
      ]);

      set({ knowledgeBase, isGenerating: false, webinarData: data });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to generate knowledge base',
        isGenerating: false
      });
    }
  },

  updateKnowledgeBase: (knowledgeBase) => set({ knowledgeBase }),

  updateWebinarName: async (name) => {
    const { currentWebinarId } = get();
    if (!currentWebinarId) return;

    try {
      await webinarDB.updateWebinar(currentWebinarId, { name });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update webinar name' });
    }
  },

  clearError: () => set({ error: null }),
  setShowKnowledgeBase: (show) => set({ showKnowledgeBase: show }),


}));