import { supabase } from '../supabase';
import type { DBWebinar, DBKnowledgeBase, WithoutSystemFields } from '../../types/database';
import type { WebinarKnowledgeBase } from '../../types/webinar';

export async function getWebinars(userId: string): Promise<DBWebinar[]> {
  if (!userId) {
    console.error('No user ID provided to getWebinars');
    throw new Error('User ID is required');
  }

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching webinars:', error);
    throw error;
  }

  return data || [];
}

export async function createWebinar(userId: string): Promise<DBWebinar> {
  const { data, error } = await supabase
    .from('webinars')
    .insert([{
      user_id: userId,
      name: 'My First Webinar',
      description: '',
      status: 'draft'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWebinar(
  id: string,
  updates: Partial<WithoutSystemFields<DBWebinar>>
): Promise<DBWebinar> {
  const { data, error } = await supabase
    .from('webinars')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getKnowledgeBase(webinarId: string): Promise<WebinarKnowledgeBase | null> {
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select()
    .eq('webinar_id', webinarId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No knowledge base exists yet - this is normal for new webinars
      return null;
    }
    throw error;
  }

  return {
    campaignOutline: data.campaign_outline,
    audienceData: data.audience_data,
    ultimateClientGoals: data.ultimate_client_goals,
    webinarValueProposition: data.webinar_value_proposition,
    webinarSummary: data.webinar_summary,
  };
}

export async function createKnowledgeBase(
  webinarId: string, 
  knowledgeBase: WebinarKnowledgeBase
): Promise<DBKnowledgeBase> {
  const { data, error } = await supabase
    .from('knowledge_bases')
    .insert([{
      webinar_id: webinarId,
      campaign_outline: knowledgeBase.campaignOutline,
      audience_data: knowledgeBase.audienceData,
      ultimate_client_goals: knowledgeBase.ultimateClientGoals,
      webinar_value_proposition: knowledgeBase.webinarValueProposition,
      webinar_summary: knowledgeBase.webinarSummary,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}