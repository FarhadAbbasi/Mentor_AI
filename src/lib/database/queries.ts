import { supabase } from '../supabase';
import type { WithoutSystemFields, WithoutTimestamps } from './types';
import type { 
  DBWebinar, 
  DBKnowledgeBase, 
  DBTopic, 
  DBProduct, 
  DBBonus, 
  DBSlide,
  DBKnowledgeSource 
} from './types';

export async function getSlides(webinarId: string): Promise<DBSlide[]> {
  const { data, error } = await supabase
    .from('slides')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('order_index');

  if (error) {
    console.error('Error fetching slides:', error);
    throw error;
  }

  return data || [];
}

// Add these new queries
export async function getWebinarWithProgress(webinarId: string) {
  const { data, error } = await supabase
    .from('webinars')
    .select(`
      *,
      knowledge_bases!left (
        id,
        campaign_outline,
        audience_data,
        ultimate_client_goals,
        webinar_value_proposition,
        webinar_summary
      ),
      topics!left (
        id,
        name,
        description,
        order_index
      ),
      products!left (
        id,
        name,
        description,
        regular_price,
        special_price,
        bonuses!left (
          id,
          name,
          description,
          value
        )
      ),
      slides!left (
        id,
        title,
        content,
        script,
        order_index
      ),
      knowledge_sources!left (
        id,
        title,
        content,
        source_type,
        file_url
      )
    `)
    .eq('id', webinarId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateWebinarStatus(webinarId: string, status: DBWebinar['status']) {
  const { data, error } = await supabase
    .from('webinars')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', webinarId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWebinar(webinarId: string) {
  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('id', webinarId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAvatar(avatarId: string) {
  const { data, error } = await supabase
    .from('avatars')
    .select('id, name, preview_video_url, preview_photo_url,heygen_avatar_id')
    .eq('id', avatarId)
    .single();

  if (error) {
    console.error('Error fetching avatar:', error);
    throw error;
  }

  return data;
}

export async function getTheme(themeId: string) {
  const { data, error } = await supabase
    .from('themes')
    .select('id, name, preview_url')
    .eq('id', themeId)
    .single();

  if (error) {
    console.error('Error fetching theme:', error);
    throw error;
  }

  return data;
}



// Keep existing queries but update them to use the new type utilities
// ... rest of the existing queries