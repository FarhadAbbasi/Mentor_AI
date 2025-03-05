import type { WebinarKnowledgeBase } from '../../types/webinar';

interface Slide {
  id: string;
  title: string;
  content: string;
  type: string;
  script: string | null;
}

const WEBINAR_STRUCTURE = {
  intro: {
    purpose: 'Hook audience and establish credibility',
    style: 'Engaging and welcoming',
    timing: 'First 5-10% of webinar'
  },
  story: {
    purpose: 'Build rapport and demonstrate transformation',
    style: 'Personal and relatable',
    timing: 'Early webinar phase'
  },
  pain: {
    purpose: 'Highlight problems and create urgency',
    style: 'Empathetic and understanding',
    timing: 'Before solution'
  },
  solution: {
    purpose: 'Present your unique methodology',
    style: 'Clear and authoritative',
    timing: 'Middle of webinar'
  },
  offer: {
    purpose: 'Present value proposition',
    style: 'Confident and compelling',
    timing: 'After solution'
  },
  close: {
    purpose: 'Drive action and handle objections',
    style: 'Urgent and persuasive',
    timing: 'End of webinar'
  }
};

function getSlideContext(
  currentSlide: Slide,
  allSlides: Slide[],
  currentIndex: number
): string {
  const slideType = WEBINAR_STRUCTURE[currentSlide.type as keyof typeof WEBINAR_STRUCTURE];
  const previousSlides = allSlides.slice(0, currentIndex);
  const upcomingSlides = allSlides.slice(currentIndex + 1, currentIndex + 4);
  
  const hasIntroBeenDone = previousSlides.some(s => s.type === 'intro');
  const hasStoryBeenTold = previousSlides.some(s => s.type === 'story');
  const hasPainBeenAddressed = previousSlides.some(s => s.type === 'pain');
  
  return `
Current Slide Context:
- Position: ${currentIndex + 1} of ${allSlides.length}
- Type: ${currentSlide.type.toUpperCase()}
- Purpose: ${slideType?.purpose}
- Style: ${slideType?.style}
- Timing: ${slideType?.timing}

Narrative Flow Status:
${hasIntroBeenDone ? '✓' : '×'} Introduction completed
${hasStoryBeenTold ? '✓' : '×'} Story shared
${hasPainBeenAddressed ? '✓' : '×'} Pain points addressed

Previous Content Flow:
${previousSlides
  .slice(-2)
  .map(s => `[${s.type.toUpperCase()}] ${s.title}: ${s.script || s.content}`)
  .join('\n')}

Upcoming Content Preview:
${upcomingSlides
  .map(s => `[${s.type.toUpperCase()}] ${s.title}: ${s.content}`)
  .join('\n')}`;
}

export function generateScriptPrompt(
  currentSlide: Slide,
  allSlides: Slide[],
  currentIndex: number,
  knowledgeBase: WebinarKnowledgeBase
): string {
  const context = getSlideContext(currentSlide, allSlides, currentIndex);
  
  return `You are an expert webinar script writer trained by Russell Brunson and Dan Kennedy.
Write a concise, natural script for a webinar presentation slide.
Focus on maintaining narrative flow and building towards the offer.

${context}

Webinar Overview:
Title: ${knowledgeBase.webinarSummary.name}
Target: ${knowledgeBase.webinarSummary.targetAudience}
Value: ${knowledgeBase.webinarValueProposition.benefits}
Product: ${knowledgeBase.campaignOutline.productName} (${knowledgeBase.campaignOutline.productPrice})
Pain Points: ${knowledgeBase.webinarValueProposition.painPoints.join(', ')}
Solution: ${knowledgeBase.webinarValueProposition.solution}

Current Slide Content:
Title: ${currentSlide.title}
Content: ${currentSlide.content}

Write a brief, natural script (2-3 sentences) that:
1. Flows naturally from previous content
2. Delivers the key message effectively
3. Sets up upcoming content
4. Maintains consistent tone and energy
5. Builds towards the ultimate offer

Keep the script concise and focused on the slide's purpose within the overall webinar flow.`;
}