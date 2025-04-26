import { toast } from 'react-toastify';
import { supabase } from '../supabase';
import { video } from 'framer-motion/client';

interface VideoClipsData {
  id: string;
  created_at: string;
  updated_at?: string;
  webinar_id: string;
  heygen_video_id: string; // Video ID from Heygen
  video_url: string;
  thumbnail_url: string;
  order_index: number;
  duration: number;

}

interface FinalVideoData {
  id: string;
  created_at: string;
  updated_at?: string;
  webinar_id: string;
  video_id: any; // Video ID from Shotstack
  video_url: any;
  duration: any;

  // video_id: string; // Video ID from Shotstack
  // video_url: string;
  // duration: number;
}

interface LandingPageData {
  id: string;
  created_at: string;
  updated_at?: string;
  webinar_id: string;
  name: string,
  url: string,
  admin_url: string,
  site_id: string,
}


export async function saveVideoClips(
  webinarId: string,
  videoClips: Omit<VideoClipsData, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>[]
) {
  if (!webinarId || !videoClips.length) return;

  // First delete existing clips
  await supabase
    .from('video_clips')
    .delete()
    .eq('webinar_id', webinarId);

  console.log('Video Data in Supabase Save videos', videoClips);
  // Then insert new Clips
  const { data, error } = await supabase
    .from('video_clips')
    .insert(
      videoClips.map(clip => ({
        ...clip,
        webinar_id: webinarId
      }))
    )
    .select();
  toast.success('Saved Video Clips');

  if (error) throw error;
  return data;
}


export async function saveFinalVideoId(webinar_id: string | null, final_video_id: string) {
  if (!webinar_id || !final_video_id) return;

  const { data, error } = await supabase
    .from('webinars')
    .update({ video_id: final_video_id })
    .eq('id', webinar_id);

  console.log('Save final video data in webinar:', data);

  if (error) {
    console.error('Error saving Final Video :', error);
    toast.error('Error saving Final Video ID');
    return;
  }
};



export async function saveFinalVideo(
  webinar_id: string,
  // final_video: Omit<FinalVideoData, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>[]
  final_video: any
) {
  // if (!webinar_id || !final_video.length) return;
  console.log('Final Video in Supabase Save videos', final_video);

  // First delete existing Video
    await supabase
    .from('final_videos')
    .delete()
    .eq('webinar_id', webinar_id);

  // Then insert new Video
  const { data, error } = await supabase
    .from('final_videos')
    .insert([
      {
        webinar_id,
        video_id: final_video.video_id,
        url: final_video.url,
        duration: final_video.duration,
      }
    ])
    .select();

  if (data) {
    console.log('Final Video Data in Supabase Save videos', data);
    toast.success('Saved Final Video');
  }
  if (error) throw error;
  return data;
}



///////////////////////////////////////////////////////////////////////////

export async function saveLandingPageStatus(webinar_id: string | null) {
  if (!webinar_id ) return;

  const { data, error } = await supabase
    .from('webinars')
    .update({ landing_page_deployed: true })
    .eq('id', webinar_id);

  console.log('Save Landing Page Status in webinar:', data);

  if (error) {
    console.error('Error saving Landing Page Status :', error);
    toast.error('Error saving Landing Page Status');
    return;
  }
};


export async function saveLandingPage(
  webinar_id: string,
  landing_page_data: any | null
) {
  if (!webinar_id || !landing_page_data) return;
  console.log('Landing Page data in Save to Supabase', landing_page_data);

    // // First delete existing Landing Page URL
    // await supabase
    // .from('landing_pages')
    // .delete()
    // .eq('webinar_id', webinar_id);

  // Then insert new Landing Page URL 
  const { data, error } = await supabase
  .from('landing_pages')
  .upsert([   // Upsert will insert if doesn't exist, update if exists
    {
      webinar_id: webinar_id,
      site_id: landing_page_data.site_id,
      name: landing_page_data.name,
      url: landing_page_data.url,
      admin_url: landing_page_data.admin_url,
  }
  ], {
    onConflict: 'webinar_id', // It will check where to update or insert
  })
  .select()
  .single();


  if (data) {
    console.log('Landing Page URL in Supabase Save videos', data);
    toast.success('Saved Landing Page');
  }
  if (error) throw error;
  return data;
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
  toast.success('Landing Page Content Saved Successfully!');
  return data;
}