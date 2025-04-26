import { toast } from "react-toastify";
import { supabase } from "../../../lib/supabase";
import { Slide, WebinarKnowledgeBase } from "../../../types/webinar";


export function generateLandingPagePrompt(
  knowledgeBase: WebinarKnowledgeBase,
  slides: Slide[]
): string {

  return `You are a landing page conversion expert and content strategist.

You will receive 2 inputs:
1. "knowledgeBase": JSON containing the core ideas of a webinar.
2. "slides": an array of slide objects, each with title, content, and script.

Your task is to:
- Understand what the webinar is about,
- Analyze what it offers to viewers (benefits, emotional hooks, outcomes),
- Extract pain points, goals, and value,
- Then generate JSON content for the sections of landing page in the following format:

  {
    webinar_id: '',
  
    heroSlides: [
      {
        title: '',
        subtitle: '',
        date: '',
        image: 'provide suitable tags to search image from unsplash'
      },
      {
        title: '',
        subtitle: '',
        date: '',
        image: 'provide suitable tags to search image from unsplash'
      }
    ],
  
    stats: [
      { icon: 'suitable icon from <Icon_list>', count: 'provide numerics only', label: '' },
      { icon: 'suitable icon from <Icon_list>', count: 'provide numerics only', label: '' },
      { icon: 'suitable icon from <Icon_list>', count: 'provide numerics only', label: '' },
      { icon: 'suitable icon from <Icon_list>', count: 'provide numerics only', label: '' },
    ],
  
    benefitsData: {
      description: '',
      benefits: [
        {
          icon: 'suitable icon from <Icon_list>',
          title: '',
          description: ''
        },
        {
          icon: 'suitable icon from <Icon_list>',
          title: '',
          description: ''
        },
        {
          icon: 'suitable icon from <Icon_list>',
          title: '',
          description: ''
        }
      ]
    },
  
    mentor: {
      name: 'suggest a random name',
      hook: '',
      bio: '',
      image: 'provide suitable tags to search image from unsplash'
    },
  
    goalsData: {
      title: '',
      description: '',
      goals: [
        {
          icon: 'suitable icon from <Icon_list>',
          title: '',
          description: '',
        },
        {
          icon: 'suitable icon from <Icon_list>',
          title: '',
          description: '',
        },
        {
          icon: 'suitable icon from <Icon_list>',
          title: '',
          description: '',
        }
      ]
    },

    agenda: [
    { topic: ' topic 1 from "agenda" slide},
    { topic: 'topic 2 from "agenda" slide},
     ...
     { topic: 'topic N from "agenda" slide}
    ]
  
    offerData: {
      title: '',
      image: 'provide suitable tags to search image from unsplash'
      offers: [
        { title: '' },
        { title: '' },
        { title: '' }
      ]
    },
  
    testimonials: [
      {
        name: '',
        review: '',
        role: ''
      },
      {
        name: '',
        review: '',
        role: ''
      },
      {
        name: '',
        review: '',
        role: ''
      }
    ],

    ctaFinal : {
      title: '',
      image: 'provide suitable tags to search image from unsplash'
    },
  }


  Icon_List : {Heart || Sparkle || Star || Clock || Apple || BookOpen || CheckCircle || Trophy || ShieldCheck || LightBulb || Bolt || Globe  || Users  || Briefcase }
  - Use the icons from the list above to represent ideas visually.
  - Use the icons that best fit the context of the content.

Guidelines:
- Make the tone confident, helpful, emotionally resonant, and free of any needy language.
- Content should be clear, easy to understand, engaging and for all levels (beginers, intermediate, advanced)
- Use modern, professional wording with strong emotional and practical appeal.
- Suggest the Tags specifically that best fit the context of the section for image hunting from unsplash websie. 
- Each section should be designed to encourage signups or views.

Now, analyze the following inputs and generate the final landing page JSON:

Knowledge_Base: ${JSON.stringify(knowledgeBase, null, 2)}
Slides: ${JSON.stringify(slides, null, 2)}

`;
}



export const generateLandingPageContent = async (knowledgeBase: WebinarKnowledgeBase, slides: Slide[]) => {

  if (!knowledgeBase || !slides.length) return;
  console.log('Generating Landing Page Content ... ');

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
            //   content: generateScriptPrompt(currentSlide, slides, currentSlideIndex, knowledgeBase)
            content: generateLandingPagePrompt(knowledgeBase, slides)
          },
          {
            role: 'user',
            content: 'Write the Landing Page Content following the provided context and guidelines.'
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log('GPT Response for Landing Page Content is :', data);

    const contentLP = JSON.parse(data.choices[0].message.content);
    console.log('Webinar_id in Landing Page Content is :', contentLP.webinar_id);
    console.log('Landing Page Content JSON is :', contentLP);
    return contentLP;
    //   await handleScriptChange(script);
  } catch (error) {
    console.error('Error generating Landing Page content:', error);
  }
};


async function fetchUnsplashImage(query: string) {
  // const accessKey = "YOUR_UNSPLASH_ACCESS_KEY"; // Replace this with your actual key
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.log('Unsplash key is not set');
    return null;
  }

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${accessKey}`
  );

  const data = await response.json();

  if (data?.results?.length > 0) {
    return data.results[0].urls.regular;
  } else {
    console.warn(`No Unsplash image found for query: ${query}`);
    return null;
  }
}


export async function prepareContentWithImages(contentLP: any) {

  if (!contentLP) return;
  console.log('Preparing Images for Landing Page Content...');

  const heroSlidesWithImages = await Promise.all(
    contentLP?.heroSlides?.map(async (slide: any) => {
      // const query = slide.title || slide.subtitle || "inspiration";
      const query = slide?.image || slide.title || "inspiration";
      const image = await fetchUnsplashImage(query);
      return {
        ...slide,
        image: image
      };
    })
  );

  // const offerImage = await  fetchUnsplashImage(contentLP?.offerData?.title || 'Inspiration Bonus Offer');
  // const mentorImage = await fetchUnsplashImage(` Inspiration Mentor ${contentLP?.mentor?.name} ${contentLP.mentor.hook}`)
  // const ctaImage = await fetchUnsplashImage(`Inspiration CTA ${contentLP?.ctaFinal?.title}`)
  const [offerImage, mentorImage, ctaImage] = await Promise.all([
    fetchUnsplashImage('win coins'),  // ` win coins ${contentLP?.offerData?.image}`),
    fetchUnsplashImage( `profile `), // May also be added ${contentLP?.mentor.image}
    fetchUnsplashImage(`win ${contentLP?.ctaFinal.image}`)
  ])

  const offrImage = "https://plus.unsplash.com/premium_photo-1676998622673-41a8dd7b856a?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const updatedContentLP = {
    ...contentLP,
    heroSlides: heroSlidesWithImages,
    offerData: { ...contentLP.offerData, image: offrImage || offerImage },
    mentor: { ...contentLP.mentor, image: mentorImage },
    ctaFinal: { ...contentLP.ctaFinal, image: ctaImage }
  }
  return updatedContentLP;
}





export const saveLandingPageContent = async (webinar_id: string, content: any) => {
  console.log('Saving Landing Page Content');

  const { data, error } = await supabase
    .from('landing_pages')
    .upsert([
      {
        webinar_id: webinar_id,
        content: content,
      }
    ], {
      onConflict: 'webinar_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving Landing Page Content:', error);
    throw error;
  }
  console.log('Landing Page Content Saved: ', data);
  return data;
}