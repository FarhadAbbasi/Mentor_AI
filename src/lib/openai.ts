import OpenAI from 'openai';
import type { WebinarData, WebinarKnowledgeBase, Slide } from '../types/webinar';

const apiKey = import.meta.env.VITE_OPEN_AI_KEY;

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

const KNOWLEDGE_BASE_PROMPT = `You are an expert webinar content creator trained by Russell Brunson and Dan Kennedy.
Create a comprehensive webinar knowledge base following their proven frameworks and methodologies.
Focus on creating high-converting content that delivers value while leading to a sale.

Return a JSON object with the following structure:
{
  "campaignOutline": {
    "productName": "Name of the product/service",
    "productPrice": "Special offer price",
    "regularPrice": "Regular price",
    "valueProposition": "Core value proposition"
  },
  "audienceData": {
    "niche": "Target market niche",
    "targetAudience": ["Detailed audience persona 1", "Detailed audience persona 2"]
  },
  "ultimateClientGoals": {
    "painPoint": "Primary pain point addressed",
    "shortTermGoal": "Immediate benefit",
    "longTermGoal": "Ultimate transformation"
  },
  "webinarValueProposition": {
    "secretInformation": "Unique insight or method",
    "benefits": "Key benefits summary",
    "painPoints": ["Specific pain point 1", "Specific pain point 2"],
    "solution": "Your unique solution"
  },
  "webinarSummary": {
    "name": "Compelling webinar title",
    "topics": ["Key topic 1", "Key topic 2"],
    "targetAudience": "Who this is for",
    "benefits": "What they'll learn"
  }
}`;

export async function generateKnowledgeBase(data: WebinarData): Promise<WebinarKnowledgeBase> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: KNOWLEDGE_BASE_PROMPT
        },
        {
          role: 'user',
          content: `Generate a webinar knowledge base based on this data:
          ${JSON.stringify(data, null, 2)}
          
          Follow the Perfect Webinar framework and ensure the content is compelling and conversion-focused.
          Return the response as a valid JSON object following the structure specified above.`
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated');

    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (parseError) {
      console.error('Error parsing knowledge base:', parseError);
      throw new Error('Failed to parse generated knowledge base');
    }
  } catch (error) {
    console.error('Error generating knowledge base:', error);
    throw error;
  }
}

export async function generateTopicDescription(
  topicName: string,
  topicIndex: number,
  webinarDescription: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert at direct marketing that studied under Dan Kennedy and Russell Brunson.
          Create compelling and conversion-focused content that follows their proven frameworks.`
        },
        {
          role: 'user',
          content: `Write a concise description for topic #${topicIndex + 1} in a webinar about:
          
          ${webinarDescription}
          
          The topic is: "${topicName}"
          
          Write 1-2 sentences that explain what should be covered in this topic.
          Focus on value and transformation, not just information.`
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating topic description:', error);
    throw new Error('Failed to generate topic description');
  }
}

interface SlideGenerationContext {
  knowledgeBase: WebinarKnowledgeBase;
  previousSlide?: Slide;
  slideType: 'intro' | 'agenda' | 'content';
  slideNumber: number;
  totalSlides: number;
}

function getSlidePrompt({ knowledgeBase, previousSlide, slideType, slideNumber, totalSlides }: SlideGenerationContext): string {
  const basePrompt = `You are an expert webinar content creator trained by Russell Brunson and Dan Kennedy.
Create a high-converting webinar slide following the Perfect Webinar framework.`;

  const contextInfo = previousSlide ? `
Previous slide:
Title: ${previousSlide.title}
${previousSlide.type === 'intro' ? `Subtitle: ${previousSlide.subtitle}` : `Content: ${previousSlide.content || ''}`}
Speaking Notes: ${previousSlide.notes}
` : '';

  const slideTypePrompts = {
    intro: `Generate a subtitle for a webinar titled: ${knowledgeBase.webinarSummary.name}
The webinar provides the following end result to the viewer: ${knowledgeBase.webinarValueProposition.benefits}
The target audience for this webinar is: ${knowledgeBase.webinarSummary.targetAudience}
The subtitle is supposed to be a 1 sentence subtitle that clearly outlines the power of the webinar, why the target audience needs it and reads fluently with the title.
Your response should be just the title of the webinar.`,
    
    agenda: `You are writing an agenda for a webinar. 
You are responsible to complete the following tasks:
1) Look over all the slides, and the content of the webinar
2) Understand what the webinar is about and what it talks about
3) Break the webinar down into 5 key sections (not less, not more, must be exactly 5)
4) Return ONLY a JSON object with exactly 5 topics

Return ONLY this JSON structure with no additional text:
{
  "topic1": "Webinar Topic 1",
  "topic2": "Webinar Topic 2", 
  "topic3": "Webinar Topic 3",
  "topic4": "Webinar Topic 4",
  "topic5": "Webinar Topic 5"
}

Here is the webinar outline:
${JSON.stringify(knowledgeBase, null, 2)}`,
    
    content: `Create a content slide that:
- Has a clear, benefit-focused title
- Contains valuable, actionable content
- Includes speaking notes that deliver the content effectively
-Should be a paragraph no more than 4,5 lines

Return a JSON object with:
{
  "title": "Clear benefit-focused title",
  "content": "Valuable actionable content that builds on previous slides",
  "notes": "Speaking notes for effective delivery"
}`
  };

  return `${basePrompt}

${contextInfo}

${slideTypePrompts[slideType]}

Return a JSON object with the following structure for a ${slideType} slide:
{
  "title": "Slide title",
  ${slideType === 'intro' ? '"subtitle": "Engaging subtitle",' : '"content": "Valuable content",'}
  "notes": "Speaking notes for delivery"
}`;
}

export async function generateSlide(context: SlideGenerationContext): Promise<Slide> {
  try {
    const prompt = getSlidePrompt(context);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: prompt
      }],
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated');
    
    try {
      let slideData;
      
      if (context.slideType === 'intro') {
        // For intro slides, parse the JSON response
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : content;
          const cleanJson = jsonStr
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\n/g, '')
            .replace(/,\s*}/g, '}');
          
          slideData = JSON.parse(cleanJson);
          
          // Validate required fields
          if (!slideData.title || !slideData.subtitle || !slideData.notes) {
            throw new Error('Invalid intro slide format');
          }
        } catch (e) {
          console.error('Failed to parse intro slide JSON:', content);
          // Fallback to default intro structure
          slideData = {
            title: context.knowledgeBase.webinarSummary.name || 'Welcome',
            subtitle: "Transform your business with powerful insights and strategies",
            notes: "Welcome everyone! Today we'll explore strategies that will transform how you work and achieve your goals."
          };
        }
      } else if (context.slideType === 'agenda') {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in agenda response');
        }

        const jsonStr = jsonMatch[0]
          .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
          .replace(/\n/g, '') // Remove newlines
          .replace(/,\s*}/g, '}'); // Remove trailing commas
        
        try {
          const parsedData = JSON.parse(jsonStr);
          let agendaTopics: string[];
          
          // Handle both possible response formats
          if (parsedData.content && typeof parsedData.content === 'object') {
            // Format: { title, content: { topic1, topic2, ... }, notes }
            agendaTopics = Object.values(parsedData.content);
          } else if (parsedData.topic1) {
            // Format: { topic1, topic2, ... }
            agendaTopics = Object.values(parsedData);
          } else {
            throw new Error('Invalid agenda format');
          }

          // Validate topic count
          if (!agendaTopics || agendaTopics.length !== 5) {
            throw new Error('Agenda must have exactly 5 topics');
          }

          slideData = {
            title: parsedData.title || "Agenda",
            content: agendaTopics
              .map((topic, i) => `${i + 1}. ${topic}`)
              .join('\n'),
            notes: parsedData.notes || "Walk through each section of the webinar, building anticipation for the value they'll receive."
          };
        } catch (e) {
          console.error('Failed to parse agenda JSON:', content);
          // Use fallback agenda
          slideData = {
            title: "Agenda",
            content: [
              "Introduction and Overview",
              "Understanding the Challenge",
              "Our Solution Approach", 
              "Implementation Strategy",
              "Next Steps and Action Items"
            ].map((topic, i) => `${i + 1}. ${topic}`).join('\n'),
            notes: "Walk through each section of the webinar, building anticipation for the value they'll receive."
          };
        }
      } else {
        try {
          slideData = JSON.parse(content.replace(/[\u201C\u201D]/g, '"'));
          
          // Validate content slide format
          if (!slideData.title || !slideData.content || !slideData.notes) {
            throw new Error('Invalid content slide format');
          }

          // Clean up any potential formatting issues
          slideData = {
            title: slideData.title.trim(),
            content: slideData.content.trim(),
            notes: slideData.notes.trim()
          };
        } catch (e) {
          console.error('Failed to parse content slide JSON:', content);
          // Provide fallback content
          slideData = {
            title: `Content Section ${context.slideNumber - 2}`,
            content: "Key insights and strategies for success",
            notes: "Deliver this content with emphasis on practical application and value."
          };
        }
      }

      return {
        id: `slide-${context.slideNumber}`,
        title: slideData.title || 'Untitled Slide',
        // subtitle: context.slideType === 'intro' ? slideData.subtitle : undefined,
        // content: context.slideType !== 'intro' ? slideData.content : undefined,
        content: context.slideType === 'intro' ? slideData.subtitle : slideData.content,
        type: context.slideType,
        notes: slideData.notes || ''
      };
    } catch (parseError) {
      console.error('Error parsing slide:', parseError);
      throw new Error('Failed to parse generated slide');
    }
  } catch (error) {
    console.error('Error generating slide:', error);
    throw error;
  }
}