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
        video_id: final_video.id,
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
export async function saveLandingPage(
  user_id: string,
  landing_page_data: any | null
) {
  if (!user_id || !landing_page_data) return;
  console.log('Landing Page URL and User_id in Save to Supabase', landing_page_data, 'Id:', user_id);

    // First delete existing Landing Page URL
    await supabase
    .from('landing_pages')
    .delete()
    .eq('user_id', user_id);

  // Then insert new Landing Page URL
  const { data, error } = await supabase
    .from('landing_pages')
    .insert([
      {
        user_id: user_id,
        name: landing_page_data.name,
        url: landing_page_data.url,
        admin_url: landing_page_data.admin_url,
        site_id: landing_page_data.site_id,
      }
    ])
    .select();

  if (data) {
    console.log('Landing Page URL in Supabase Save videos', data);
    toast.success('Saved Landing Page URL');
  }
  if (error) throw error;
  return data;
}
