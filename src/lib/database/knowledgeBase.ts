import { supabase } from '../supabase';
import type { DBKnowledgeBase, DBTopic } from './types';

export async function saveKnowledgeBase(
  webinarId: string,
  data: Omit<DBKnowledgeBase, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>
) {
  const { data: knowledgeBase, error } = await supabase
    .from('knowledge_bases')
    .insert([{ ...data, webinar_id: webinarId }])
    .select()
    .single();

  if (error) throw error;
  return knowledgeBase;
}

export async function saveTopics(webinarId: string, topics: Omit<DBTopic, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('topics')
    .insert(topics.map(topic => ({ ...topic, webinar_id: webinarId })))
    .select();

  if (error) throw error;
  return data;
}

export async function updateKnowledgeBase(
  id: string,
  updates: Partial<Omit<DBKnowledgeBase, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('knowledge_bases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}